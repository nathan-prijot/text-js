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
/** A TextJs instance. */
export declare class TextJs {
    /** The delimiters keys. */
    private _delimiters;
    /** The statements keys. */
    private _statements;
    /** The context to use for the render. */
    private _context;
    /** The result of the template processing. */
    private _nodes;
    /** The value of the trim result option. */
    private _trimResult;
    /**
     * Creates a new TextJs instance.
     * @param template - The template to process. Shortcut of {@link template}.
     * @param options - The options to apply to the TestJs instance.
     */
    constructor(template?: string, options?: ITextJsOptions);
    /**
     * Sets and process the template to render.
     * @param template - The template to process.
     * @returns The TextJs instance.
     */
    template(template: string): TextJs;
    /**
     * Sets the context for the render.
     * @param context - The context object.
     * @returns The TextJs instance.
     */
    context(context: object): TextJs;
    /**
     * Renders the template with the current instance context.
     * @param context - The context for the render. Shortcut of {@link context}.
     * @returns The render result.
     */
    render(context?: object): string;
}
//# sourceMappingURL=index.d.ts.map