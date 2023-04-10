/** Key of each statements types. */
export interface IStatements {
  /**
   * The if statement key.
   * @defaultValue `if`
   */
  if: string;
  /**
   * The else if statement key.
   * @defaultValue `elseif`
   */
  elseIf: string;
  /**
   * The else statement key.
   * @defaultValue `else`
   */
  else: string;
  /**
   * The end if statement key.
   * @defaultValue `endif`
   */
  endIf: string;
  /**
   * The for each statement key.
   * @defaultValue `foreach`
   */
  forEach: string;
  /**
   * The end for each statement key.
   * @defaultValue `endforeach`
   */
  endForEach: string;
  /**
   * The switch statement key.
   * @defaultValue `switch`
   */
  switch: string;
  /**
   * The case statement key.
   * @defaultValue `case`
   */
  case: string;
  /**
   * The default statement key.
   * @defaultValue `default`
   */
  default: string;
  /**
   * The end switch statement key.
   * @defaultValue `endswitch`
   */
  endSwitch: string;
}

/** Key of each delimiters types. */
export interface IDelimiters {
  /**
   * The JavaScript start delimiter.
   * @defaultValue `{{`
   */
  jsStartDelimiter: string;
  /**
   * The JavaScript end delimiter.
   * @defaultValue `}}`
   */
  jsEndDelimiter: string;
  /**
   * The statements start delimiter.
   * @defaultValue `{%`
   */
  statementStartDelimiter: string;
  /**
   * The statements start delimiter.
   * @defaultValue `%}`
   */
  statementEndDelimiter: string;
}

/** Options for a new TextJs instance. */
export interface ITextJsOptions {
  /** Customizes the keys of the delimiters. */
  delimiters?: Partial<IDelimiters>;
  /** Customizes the keys of the statements. */
  statements?: Partial<IStatements>;
  /** If true, removes all lines returns and lines white-spaces from the render result. */
  trimResult?: boolean;
}

/** Parsed delimited content. */
interface IStep {
  /** The type of the step. */
  type: string;
  /** The content of the step. */
  value: string;
}

/** A node. */
interface INode {
  /** Renders the node. */
  render: (context: object) => string;
}

/** A set of steps with the statement step. */
interface IStepsSet {
  /** The statement step. */
  step: IStep;
  /** The steps inside the statement. */
  steps: IStep[];
}

/** A statement condition and nodes. */
interface INodesSet {
  /** The statement condition content. */
  condition: string;
  /** The statement nodes. */
  nodes: Nodes;
}

/** A text node. */
class TextNode implements INode {
  /** The text content. */
  private _text: string;

  /**
   * Create a new text node.
   * @param step - The text step.
   */
  public constructor(step: IStep) {
    this._text = step.value;
  }

  /**
   * Renders the text node.
   * @returns The render result.
   */
  public render(): string {
    return this._text;
  }
}

/** A JavaScript node. */
class JsNode implements INode {
  /** The JavaScript evaluation content. */
  private _js: string;

  /**
   * Creates a new JavaScript node.
   * @param step - The JavaScript step.
   */
  public constructor(step: IStep) {
    this._js = Nodes.prepareJs(step.value);
  }

  /**
   * Renders the JavaScript node.
   * @param context - The context for the render.
   * @returns The render result.
   */
  public render(context: object): string {
    return Nodes.assert(this._js, context);
  }
}

/** A if node. */
class IfNode implements INode {
  /** The if and elseif conditions and nodes. */
  private _conditions: INodesSet[];
  /** The nodes inside the else. */
  private _elseNodes: Nodes | null;

  /**
   * Creates a new if node.
   * @param conditionsSteps - The conditions step and internal steps.
   * @param elseSteps - The steps inside the else statement.
   * @param statements - The statements keys used.
   */
  public constructor(
    conditionsSteps: IStepsSet[],
    elseSteps: IStep[] | null,
    statements: IStatements
  ) {
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
  public render(context: object): string {
    for (const condition of this._conditions)
      if (Nodes.assert(condition.condition, context))
        return condition.nodes.render(context);
    if (this._elseNodes) return this._elseNodes.render(context);
    return "";
  }
}

/** A foreach node. */
class ForeachNode implements INode {
  /** The item key used to inject the item in the context. */
  private _item: string;
  /** The index key used to inject the current index in the context. */
  private _index: string;
  /** The array evaluation content. */
  private _array: string;
  /** The nodes inside the foreach. */
  private _nodes: Nodes;

  /**
   * Creates a new foreach node.
   * @param step - The foreach step.
   * @param steps - The steps inside the foreach.
   * @param statements - The statements keys used.
   */
  public constructor(step: IStep, steps: IStep[], statements: IStatements) {
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
  public render(context: object): string {
    const array = Nodes.assert(this._array, context);
    if (!Array.isArray(array))
      throw new Error(
        `Incompatible argument: '${this._array}' is not an array`
      );
    return array
      .map((item, index) =>
        this._nodes.render({
          ...context,
          [this._item]: item,
          [this._index]: index,
        })
      )
      .join("");
  }
}

/** A switch node. */
class SwitchNode {
  /** The switch statement content. */
  private _switch: string;
  /** The switch cases nodes by case value. */
  private _cases: INodesSet[];
  /** The default nodes. */
  private _default: Nodes | null;

  /**
   * Creates a new switch node.
   * @param step - The switch step.
   * @param cases - The cases step and internal steps.
   * @param defaultSteps - The default steps.
   * @param statements - The statements keys used.
   */
  constructor(
    step: IStep,
    cases: IStepsSet[],
    defaultSteps: IStep[] | null,
    statements: IStatements
  ) {
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
  public render(context: object): string {
    const record: Record<string, Nodes> = {};
    for (const caseNodesSet of this._cases)
      record[Nodes.assert(caseNodesSet.condition, context)] =
        caseNodesSet.nodes;
    const nodes = record[Nodes.assert(this._switch, context)];
    if (nodes) return nodes.render(context);
    else if (this._default) return this._default.render(context);
    else return "";
  }
}

/** A set of nodes that can be rendered. */
class Nodes {
  /** The nodes contained. */
  private _nodes: INode[] = [];

  /**
   * Creates a new node set by processing them.
   * @param steps - The step to process.
   * @param statements - The statements keys used.
   */
  public constructor(steps: IStep[], statements: IStatements) {
    let token: IStep | null = null,
      subToken: IStep | null = null,
      accumulators: IStepsSet[] = [],
      accumulator: IStep[] = [],
      depthType: string | null = null,
      depth = 0;
    for (const step of steps) {
      switch (step.type) {
        case "text":
          if (token || subToken) accumulator.push(step);
          else this._nodes.push(new TextNode(step));
          break;
        case "js":
          if (token || subToken) accumulator.push(step);
          else this._nodes.push(new JsNode(step));
          break;
        case statements.if:
          if (depth === 0 && !token) {
            token = step;
            depthType = statements.if;
            depth++;
          } else if (depth > 0 && depthType === statements.if) {
            accumulator.push(step);
            depth++;
          } else accumulator.push(step);
          break;
        case statements.elseIf:
          if (!token) throw new Error(`Missing statement: '${statements.if}'`);
          else if (
            depth === 1 &&
            depthType === statements.if &&
            token.type === statements.else
          )
            throw new Error(
              `Invalid statement: '${statements.else}' must be the last element of '${statements.if}'`
            );
          else if (depthType === statements.if && depth === 1) {
            accumulators.push({ step: token, steps: accumulator });
            accumulator = [];
            token = step;
          } else accumulator.push(step);
          break;
        case statements.else:
          if (!token) throw new Error(`Missing statement: '${statements.if}'`);
          else if (
            depth === 1 &&
            depthType === statements.if &&
            token.type === statements.else
          )
            throw new Error(
              `Invalid statement: duplicate '${statements.else}' in '${statements.if}'`
            );
          else if (depthType === statements.if && depth === 1) {
            accumulators.push({ step: token, steps: accumulator });
            accumulator = [];
            token = step;
          } else accumulator.push(step);
          break;
        case statements.endIf:
          if (!token) throw new Error(`Missing statement: '${statements.if}'`);
          else if (
            depthType === statements.if &&
            depth === 1 &&
            token.type === statements.else
          ) {
            this._nodes.push(new IfNode(accumulators, accumulator, statements));
            accumulators = [];
            accumulator = [];
            token = null;
            depthType = null;
            depth--;
          } else if (depthType === statements.if && depth === 1) {
            accumulators.push({ step: token, steps: accumulator });
            this._nodes.push(new IfNode(accumulators, null, statements));
            accumulators = [];
            accumulator = [];
            token = null;
            depthType = null;
            depth--;
          } else if (depthType === statements.if) {
            accumulator.push(step);
            depth--;
          } else accumulator.push(step);
          break;
        case statements.forEach:
          if (depth === 0 && !token) {
            token = step;
            depthType = statements.forEach;
            depth++;
          } else if (depth > 0 && depthType === statements.forEach) {
            accumulator.push(step);
            depth++;
          } else accumulator.push(step);
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
          } else if (depthType === statements.forEach) {
            accumulator.push(step);
            depth--;
          } else accumulator.push(step);
          break;
        case statements.switch:
          if (depth === 0 && !token) {
            token = step;
            depthType = statements.switch;
            depth++;
          } else if (depth > 0 && depthType === statements.switch) {
            accumulator.push(step);
            depth++;
          } else accumulator.push(step);
          break;
        case statements.case:
          if (depth === 0 && depthType !== statements.switch)
            throw new Error(`Missing statement: '${statements.switch}'`);
          else if (
            depth === 1 &&
            depthType === statements.switch &&
            subToken?.type === statements.default
          )
            throw new Error(
              `Invalid statement: '${statements.default}' must be the last element of '${statements.switch}'`
            );
          else if (depth === 1 && depthType === statements.switch) {
            if (subToken) {
              accumulators.push({ step: subToken, steps: accumulator });
              accumulator = [];
            }
            subToken = step;
          } else accumulator.push(step);
          break;
        case statements.default:
          if (depth === 0 && depthType !== statements.switch)
            throw new Error(`Missing statement: '${statements.switch}'`);
          else if (
            depth === 1 &&
            depthType === statements.switch &&
            subToken?.type === statements.default
          )
            throw new Error(
              `Invalid statement: duplicate '${statements.default}' in '${statements.switch}'`
            );
          else if (depth === 1 && depthType === statements.switch) {
            if (subToken) {
              accumulators.push({ step: subToken, steps: accumulator });
              accumulator = [];
            }
            subToken = step;
          } else accumulator.push(step);
          break;
        case statements.endSwitch:
          if (depth === 0 && !token)
            throw new Error(`Missing statement: '${statements.switch}'`);
          else if (token && depthType === statements.switch && depth === 1) {
            if (subToken?.type === statements.case) {
              accumulators.push({ step: subToken, steps: accumulator });
              this._nodes.push(
                new SwitchNode(token, accumulators, null, statements)
              );
            } else
              this._nodes.push(
                new SwitchNode(token, accumulators, accumulator, statements)
              );
            accumulators = [];
            accumulator = [];
            token = null;
            subToken = null;
            depthType = null;
            depth--;
          } else if (depthType === statements.switch) {
            accumulator.push(step);
            depth--;
          } else accumulator.push(step);
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
  public render(context: object): string {
    return this._nodes.map((node) => node.render(context)).join("");
  }

  /**
   * Prepare JavaScript code for {@link assert}.
   * @param js - The JavaScript code.
   * @returns The prepared JavaScript code.
   */
  public static prepareJs(js: string): string {
    if (!js.includes("\n") && !js.includes(";")) js = `return ${js};`;
    return js;
  }

  /**
   * Assert the given JavaScript code with the given context.
   * @param js - The JavaScript code to assert.
   * @param context - The context for the assertion.
   * @returns The result of the assertion.
   */
  public static assert(js: string, context: object): string {
    try {
      return new Function(...Object.keys(context), "context", js)(
        ...Object.keys(context).map(
          (key) => (context as Record<string, unknown>)[key]
        ),
        context
      );
    } catch (e) {
      throw new Error(`Internal error in '${js}': ${e}`);
    }
  }
}

/** A TextJs instance. */
export class TextJs {
  /** The delimiters keys. */
  private _delimiters: IDelimiters;
  /** The statements keys. */
  private _statements: IStatements;
  /** The context to use for the render. */
  private _context: object = {};
  /** The result of the template processing. */
  private _nodes: Nodes | null = null;
  /** The value of the trim result option. */
  private _trimResult: boolean;

  /**
   * Creates a new TextJs instance.
   * @param template - The template to process. Shortcut of {@link template}.
   * @param options - The options to apply to the TestJs instance.
   */
  public constructor(template?: string, options?: ITextJsOptions) {
    this._delimiters = {
      jsStartDelimiter: options?.delimiters?.jsStartDelimiter || "{{",
      jsEndDelimiter: options?.delimiters?.jsEndDelimiter || "}}",
      statementStartDelimiter:
        options?.delimiters?.statementStartDelimiter || "{%",
      statementEndDelimiter: options?.delimiters?.statementEndDelimiter || "%}",
    };
    this._statements = {
      if: options?.statements?.if || "if",
      elseIf: options?.statements?.elseIf || "elseif",
      else: options?.statements?.else || "else",
      endIf: options?.statements?.endIf || "endif",
      forEach: options?.statements?.forEach || "foreach",
      endForEach: options?.statements?.endForEach || "endforeach",
      switch: options?.statements?.switch || "switch",
      case: options?.statements?.case || "case",
      default: options?.statements?.default || "default",
      endSwitch: options?.statements?.endSwitch || "endswitch",
    };
    this._trimResult = options?.trimResult || false;
    if (template) this.template(template);
  }

  /**
   * Sets and process the template to render.
   * @param template - The template to process.
   * @returns The TextJs instance.
   */
  public template(template: string): TextJs {
    if (this._trimResult) template = template.replace(/^\s+|\s+$|$\n/gm, "");

    const steps: IStep[] = [];

    let startIndex = 0,
      endIndex = 0,
      lookingFor: string | null = null,
      value: string;
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
          if (match) steps.push({ type: match[1], value: match[2] });
        }
        startIndex = endIndex + lookingFor.length;
        lookingFor = null;
      } else {
        const nextJsIndex = template.indexOf(
          this._delimiters.jsStartDelimiter,
          startIndex
        );
        const nextStatementIndex = template.indexOf(
          this._delimiters.statementStartDelimiter,
          startIndex
        );
        if (
          nextJsIndex !== -1 &&
          (nextStatementIndex === -1 || nextStatementIndex > nextJsIndex)
        ) {
          lookingFor = this._delimiters.jsEndDelimiter;
          endIndex = nextJsIndex;
          value = template.substring(startIndex, endIndex);
          startIndex = endIndex + this._delimiters.jsEndDelimiter.length;
        } else if (
          nextStatementIndex !== -1 &&
          (nextJsIndex === -1 || nextJsIndex > nextStatementIndex)
        ) {
          lookingFor = this._delimiters.statementEndDelimiter;
          endIndex = nextStatementIndex;
          value = template.substring(startIndex, endIndex);
          startIndex = endIndex + this._delimiters.statementEndDelimiter.length;
        } else {
          endIndex = template.length;
          value = template.substring(startIndex, endIndex);
          startIndex = endIndex;
        }

        if (value.includes(this._delimiters.jsEndDelimiter))
          throw new Error(
            `Missing delimiter: '${this._delimiters.jsStartDelimiter}'`
          );
        else if (value.includes(this._delimiters.statementEndDelimiter))
          throw new Error(
            `Missing delimiter: '${this._delimiters.statementStartDelimiter}'`
          );
        if (value) steps.push({ type: "text", value: value });
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
  public context(context: object): TextJs {
    this._context = context;
    return this;
  }

  /**
   * Renders the template with the current instance context.
   * @param context - The context for the render. Shortcut of {@link context}.
   * @returns The render result.
   */
  public render(context?: object): string {
    if (context) this.context(context);

    if (this._nodes) return this._nodes.render(this._context);
    return "";
  }
}
