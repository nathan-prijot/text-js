/** A text node. */
class TextNode {
    /**
     * Create a new text node.
     * @param step - The text step.
     */
    constructor(step) {
        this._text = step.value;
    }
    /**
     * Renders the text node.
     * @returns The render result.
     */
    render() {
        return this._text;
    }
}
/** A JavaScript node. */
class JsNode {
    /**
     * Creates a new JavaScript node.
     * @param step - The JavaScript step.
     */
    constructor(step) {
        this._js = Nodes.prepareJs(step.value);
    }
    /**
     * Renders the JavaScript node.
     * @param context - The context for the render.
     * @returns The render result.
     */
    render(context) {
        return Nodes.assert(this._js, context);
    }
}
/** A if node. */
class IfNode {
    /**
     * Creates a new if node.
     * @param conditionsSteps - The conditions step and internal steps.
     * @param elseSteps - The steps inside the else statement.
     * @param statements - The statements keys used.
     */
    constructor(conditionsSteps, elseSteps, statements) {
        this._conditions = conditionsSteps.map((conditionSteps) => {
            return {
                condition: Nodes.prepareJs(conditionSteps.step.value),
                nodes: new Nodes(conditionSteps.steps, statements),
            };
        });
        this._elseNodes = elseSteps && new Nodes(elseSteps, statements);
    }
    /**
     * Renders the if node.
     * @param context - The context for the render.
     * @returns The render result.
     */
    render(context) {
        for (const condition of this._conditions)
            if (Nodes.assert(condition.condition, context))
                return condition.nodes.render(context);
        if (this._elseNodes)
            return this._elseNodes.render(context);
        return "";
    }
}
/** A foreach node. */
class ForeachNode {
    /**
     * Creates a new foreach node.
     * @param step - The foreach step.
     * @param steps - The steps inside the foreach.
     * @param statements - The statements keys used.
     */
    constructor(step, steps, statements) {
        const inSplit = step.value.split(" in ");
        const commaSplit = inSplit[0].split(",");
        this._item = commaSplit[0].trim();
        this._index = commaSplit[1] ? commaSplit[1].trim() : "index";
        this._array = Nodes.prepareJs(inSplit[1]);
        this._nodes = new Nodes(steps, statements);
    }
    /**
     * Renders the foreach node.
     * @param context - The context for the render.
     * @returns The render result.
     */
    render(context) {
        const array = Nodes.assert(this._array, context);
        if (!Array.isArray(array))
            throw new Error(`Incompatible argument: '${this._array}' is not an array`);
        return array
            .map((item, index) => this._nodes.render({
            ...context,
            [this._item]: item,
            [this._index]: index,
        }))
            .join("");
    }
}
/** A switch node. */
class SwitchNode {
    /**
     * Creates a new switch node.
     * @param step - The switch step.
     * @param cases - The cases step and internal steps.
     * @param defaultSteps - The default steps.
     * @param statements - The statements keys used.
     */
    constructor(step, cases, defaultSteps, statements) {
        this._switch = Nodes.prepareJs(step.value);
        this._cases = cases.map((caseStepsSet) => {
            return {
                condition: Nodes.prepareJs(caseStepsSet.step.value),
                nodes: new Nodes(caseStepsSet.steps, statements),
            };
        });
        this._default = defaultSteps && new Nodes(defaultSteps, statements);
    }
    /**
     * Renders the switch node.
     * @param context - The context for the render.
     * @returns The render result.
     */
    render(context) {
        const record = {};
        for (const caseNodesSet of this._cases)
            record[Nodes.assert(caseNodesSet.condition, context)] =
                caseNodesSet.nodes;
        const nodes = record[Nodes.assert(this._switch, context)];
        if (nodes)
            return nodes.render(context);
        else if (this._default)
            return this._default.render(context);
        else
            return "";
    }
}
/** A set of nodes that can be rendered. */
class Nodes {
    /**
     * Creates a new node set by processing them.
     * @param steps - The step to process.
     * @param statements - The statements keys used.
     */
    constructor(steps, statements) {
        /** The nodes contained. */
        this._nodes = [];
        let token = null, subToken = null, accumulators = [], accumulator = [], depthType = null, depth = 0;
        for (const step of steps) {
            switch (step.type) {
                case "text":
                    if (token || subToken)
                        accumulator.push(step);
                    else
                        this._nodes.push(new TextNode(step));
                    break;
                case "js":
                    if (token || subToken)
                        accumulator.push(step);
                    else
                        this._nodes.push(new JsNode(step));
                    break;
                case statements.if:
                    if (depth === 0 && !token) {
                        token = step;
                        depthType = statements.if;
                        depth++;
                    }
                    else if (depth > 0 && depthType === statements.if) {
                        accumulator.push(step);
                        depth++;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.elseIf:
                    if (!token)
                        throw new Error(`Missing statement: '${statements.if}'`);
                    else if (depth === 1 &&
                        depthType === statements.if &&
                        token.type === statements.else)
                        throw new Error(`Invalid statement: '${statements.else}' must be the last element of '${statements.if}'`);
                    else if (depthType === statements.if && depth === 1) {
                        accumulators.push({ step: token, steps: accumulator });
                        accumulator = [];
                        token = step;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.else:
                    if (!token)
                        throw new Error(`Missing statement: '${statements.if}'`);
                    else if (depth === 1 &&
                        depthType === statements.if &&
                        token.type === statements.else)
                        throw new Error(`Invalid statement: duplicate '${statements.else}' in '${statements.if}'`);
                    else if (depthType === statements.if && depth === 1) {
                        accumulators.push({ step: token, steps: accumulator });
                        accumulator = [];
                        token = step;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.endIf:
                    if (!token)
                        throw new Error(`Missing statement: '${statements.if}'`);
                    else if (depthType === statements.if &&
                        depth === 1 &&
                        token.type === statements.else) {
                        this._nodes.push(new IfNode(accumulators, accumulator, statements));
                        accumulators = [];
                        accumulator = [];
                        token = null;
                        depthType = null;
                        depth--;
                    }
                    else if (depthType === statements.if && depth === 1) {
                        accumulators.push({ step: token, steps: accumulator });
                        this._nodes.push(new IfNode(accumulators, null, statements));
                        accumulators = [];
                        accumulator = [];
                        token = null;
                        depthType = null;
                        depth--;
                    }
                    else if (depthType === statements.if) {
                        accumulator.push(step);
                        depth--;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.forEach:
                    if (depth === 0 && !token) {
                        token = step;
                        depthType = statements.forEach;
                        depth++;
                    }
                    else if (depth > 0 && depthType === statements.forEach) {
                        accumulator.push(step);
                        depth++;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.endForEach:
                    if (!token)
                        throw new Error(`Missing statement: '${statements.forEach}'`);
                    else if (depthType === statements.forEach && depth === 1) {
                        this._nodes.push(new ForeachNode(token, accumulator, statements));
                        accumulator = [];
                        token = null;
                        depthType = null;
                        depth--;
                    }
                    else if (depthType === statements.forEach) {
                        accumulator.push(step);
                        depth--;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.switch:
                    if (depth === 0 && !token) {
                        token = step;
                        depthType = statements.switch;
                        depth++;
                    }
                    else if (depth > 0 && depthType === statements.switch) {
                        accumulator.push(step);
                        depth++;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.case:
                    if (depth === 0 && depthType !== statements.switch)
                        throw new Error(`Missing statement: '${statements.switch}'`);
                    else if (depth === 1 &&
                        depthType === statements.switch &&
                        (subToken === null || subToken === void 0 ? void 0 : subToken.type) === statements.default)
                        throw new Error(`Invalid statement: '${statements.default}' must be the last element of '${statements.switch}'`);
                    else if (depth === 1 && depthType === statements.switch) {
                        if (subToken) {
                            accumulators.push({ step: subToken, steps: accumulator });
                            accumulator = [];
                        }
                        subToken = step;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.default:
                    if (depth === 0 && depthType !== statements.switch)
                        throw new Error(`Missing statement: '${statements.switch}'`);
                    else if (depth === 1 &&
                        depthType === statements.switch &&
                        (subToken === null || subToken === void 0 ? void 0 : subToken.type) === statements.default)
                        throw new Error(`Invalid statement: duplicate '${statements.default}' in '${statements.switch}'`);
                    else if (depth === 1 && depthType === statements.switch) {
                        if (subToken) {
                            accumulators.push({ step: subToken, steps: accumulator });
                            accumulator = [];
                        }
                        subToken = step;
                    }
                    else
                        accumulator.push(step);
                    break;
                case statements.endSwitch:
                    if (depth === 0 && !token)
                        throw new Error(`Missing statement: '${statements.switch}'`);
                    else if (token && depthType === statements.switch && depth === 1) {
                        if ((subToken === null || subToken === void 0 ? void 0 : subToken.type) === statements.case) {
                            accumulators.push({ step: subToken, steps: accumulator });
                            this._nodes.push(new SwitchNode(token, accumulators, null, statements));
                        }
                        else
                            this._nodes.push(new SwitchNode(token, accumulators, accumulator, statements));
                        accumulators = [];
                        accumulator = [];
                        token = null;
                        subToken = null;
                        depthType = null;
                        depth--;
                    }
                    else if (depthType === statements.switch) {
                        accumulator.push(step);
                        depth--;
                    }
                    else
                        accumulator.push(step);
                    break;
                default:
                    throw new Error(`Unknown statement: '${step.type}'`);
            }
        }
        if (depthType === statements.if)
            throw new Error(`Missing statement: '${statements.endIf}'`);
        else if (depthType === statements.forEach)
            throw new Error(`Missing statement: '${statements.endForEach}'`);
        else if (depthType === "switch")
            throw new Error(`Missing statement: '${statements.endSwitch}'`);
    }
    /**
     * Renders the nodes.
     * @param context - The context for the render.
     * @returns The render result.
     */
    render(context) {
        return this._nodes.map((node) => node.render(context)).join("");
    }
    /**
     * Prepare JavaScript code for {@link assert}.
     * @param js - The JavaScript code.
     * @returns The prepared JavaScript code.
     */
    static prepareJs(js) {
        if (!js.includes("\n") && !js.includes(";"))
            js = `return ${js};`;
        return js;
    }
    /**
     * Assert the given JavaScript code with the given context.
     * @param js - The JavaScript code to assert.
     * @param context - The context for the assertion.
     * @returns The result of the assertion.
     */
    static assert(js, context) {
        try {
            return new Function(...Object.keys(context), "context", js)(...Object.keys(context).map((key) => context[key]), context);
        }
        catch (e) {
            throw new Error(`Internal error in '${js}': ${e}`);
        }
    }
}
/** A TextJs instance. */
export class TextJs {
    /**
     * Creates a new TextJs instance.
     * @param template - The template to process. Shortcut of {@link template}.
     * @param options - The options to apply to the TestJs instance.
     */
    constructor(template, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        /** The context to use for the render. */
        this._context = {};
        /** The result of the template processing. */
        this._nodes = null;
        this._delimiters = {
            jsStartDelimiter: ((_a = options === null || options === void 0 ? void 0 : options.delimiters) === null || _a === void 0 ? void 0 : _a.jsStartDelimiter) || "{{",
            jsEndDelimiter: ((_b = options === null || options === void 0 ? void 0 : options.delimiters) === null || _b === void 0 ? void 0 : _b.jsEndDelimiter) || "}}",
            statementStartDelimiter: ((_c = options === null || options === void 0 ? void 0 : options.delimiters) === null || _c === void 0 ? void 0 : _c.statementStartDelimiter) || "{%",
            statementEndDelimiter: ((_d = options === null || options === void 0 ? void 0 : options.delimiters) === null || _d === void 0 ? void 0 : _d.statementEndDelimiter) || "%}",
        };
        this._statements = {
            if: ((_e = options === null || options === void 0 ? void 0 : options.statements) === null || _e === void 0 ? void 0 : _e.if) || "if",
            elseIf: ((_f = options === null || options === void 0 ? void 0 : options.statements) === null || _f === void 0 ? void 0 : _f.elseIf) || "elseif",
            else: ((_g = options === null || options === void 0 ? void 0 : options.statements) === null || _g === void 0 ? void 0 : _g.else) || "else",
            endIf: ((_h = options === null || options === void 0 ? void 0 : options.statements) === null || _h === void 0 ? void 0 : _h.endIf) || "endif",
            forEach: ((_j = options === null || options === void 0 ? void 0 : options.statements) === null || _j === void 0 ? void 0 : _j.forEach) || "foreach",
            endForEach: ((_k = options === null || options === void 0 ? void 0 : options.statements) === null || _k === void 0 ? void 0 : _k.endForEach) || "endforeach",
            switch: ((_l = options === null || options === void 0 ? void 0 : options.statements) === null || _l === void 0 ? void 0 : _l.switch) || "switch",
            case: ((_m = options === null || options === void 0 ? void 0 : options.statements) === null || _m === void 0 ? void 0 : _m.case) || "case",
            default: ((_o = options === null || options === void 0 ? void 0 : options.statements) === null || _o === void 0 ? void 0 : _o.default) || "default",
            endSwitch: ((_p = options === null || options === void 0 ? void 0 : options.statements) === null || _p === void 0 ? void 0 : _p.endSwitch) || "endswitch",
        };
        this._trimResult = (options === null || options === void 0 ? void 0 : options.trimResult) || false;
        if (template)
            this.template(template);
    }
    /**
     * Sets and process the template to render.
     * @param template - The template to process.
     * @returns The TextJs instance.
     */
    template(template) {
        if (this._trimResult)
            template = template.replace(/^\s+|\s+$|$\n/gm, "");
        const steps = [];
        let startIndex = 0, endIndex = 0, lookingFor = null, value;
        while (startIndex < template.length || endIndex < template.length - 1) {
            if (lookingFor) {
                endIndex = template.indexOf(lookingFor, startIndex);
                if (endIndex === -1)
                    throw new Error(`Missing delimiter: '${lookingFor}'`);
                value = template.substring(startIndex, endIndex).trim();
                if (value && lookingFor === this._delimiters.jsEndDelimiter)
                    steps.push({ type: "js", value: value });
                else if (value) {
                    const regex = /^\s*(\w+)\s*(.*)/;
                    const match = regex.exec(value);
                    if (match)
                        steps.push({ type: match[1], value: match[2] });
                }
                startIndex = endIndex + lookingFor.length;
                lookingFor = null;
            }
            else {
                const nextJsIndex = template.indexOf(this._delimiters.jsStartDelimiter, startIndex);
                const nextStatementIndex = template.indexOf(this._delimiters.statementStartDelimiter, startIndex);
                if (nextJsIndex !== -1 &&
                    (nextStatementIndex === -1 || nextStatementIndex > nextJsIndex)) {
                    lookingFor = this._delimiters.jsEndDelimiter;
                    endIndex = nextJsIndex;
                    value = template.substring(startIndex, endIndex);
                    startIndex = endIndex + this._delimiters.jsEndDelimiter.length;
                }
                else if (nextStatementIndex !== -1 &&
                    (nextJsIndex === -1 || nextJsIndex > nextStatementIndex)) {
                    lookingFor = this._delimiters.statementEndDelimiter;
                    endIndex = nextStatementIndex;
                    value = template.substring(startIndex, endIndex);
                    startIndex = endIndex + this._delimiters.statementEndDelimiter.length;
                }
                else {
                    endIndex = template.length;
                    value = template.substring(startIndex, endIndex);
                    startIndex = endIndex;
                }
                if (value.includes(this._delimiters.jsEndDelimiter))
                    throw new Error(`Missing delimiter: '${this._delimiters.jsStartDelimiter}'`);
                else if (value.includes(this._delimiters.statementEndDelimiter))
                    throw new Error(`Missing delimiter: '${this._delimiters.statementStartDelimiter}'`);
                if (value)
                    steps.push({ type: "text", value: value });
            }
        }
        this._nodes = new Nodes(steps, this._statements);
        return this;
    }
    /**
     * Sets the context for the render.
     * @param context - The context object.
     * @returns The TextJs instance.
     */
    context(context) {
        this._context = context;
        return this;
    }
    /**
     * Renders the template with the current instance context.
     * @param context - The context for the render. Shortcut of {@link context}.
     * @returns The render result.
     */
    render(context) {
        if (context)
            this.context(context);
        if (this._nodes)
            return this._nodes.render(this._context);
        return "";
    }
}
//# sourceMappingURL=index.js.map