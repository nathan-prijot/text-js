# Text Js

![license-badge](https://img.shields.io/npm/l/text-js-render)
![coverage-badge](https://img.shields.io/badge/coverage-100%25-brightgreen)
![version-badge](https://img.shields.io/npm/v/text-js-render)
![downloads-badge](https://img.shields.io/npm/dt/text-js-render)

Text Js is a weird template language allowing you to put JavaScript code inside any kind of text template. Generating HTML, XML, CSV or even JSON (as useless as it my sound) becomes an easy task with Text Js !

## Installation

```bash
npm install text-js-render
```

## Usage

As a node module:

```js
const { TextJs } = require("text-js-render");

const template = "<h1>{{text}}</h1>";
const context = { text: "My text" };
const result = new TextJs(template).render(context);
```

As an esm module:

```js
import { TextJs } from "text-js-render";

const template = "<h1>{{text}}</h1>";
const context = { text: "My text" };
const result = new TextJs(template).render(context);
```

In the browser:

```js
const { TextJs } = await import(
  "https://unpkg.com/text-js-render@^1.0.0/module/index.js?module"
);

const template = "<h1>{{text}}</h1>";
const context = { text: "My text" };
const result = new TextJs(template).render(context);
```

**Remark**: for browser, a minified version is also available at [https://unpkg.com/text-js-render@^1.0.0/module/index.min.js?module](https://unpkg.com/text-js-render@^1.0.0/module/index.min.js?module)

### Basic example

```ts
import { TextJs } from "text-js-render";

// Specify a context
const context = {
  articles: [
    {
      title: "Text Js is amazing !",
      description:
        "Why rendering templates using Function is amazing and more.",
      author: {
        name: "Nathan Prijot",
        email: "nathanprijot@ipnosite.be",
      },
      date: "01-04-23",
    },
  ],
};

// Specify a template
const template = `
{% foreach article in articles %}
    <h3>{{ article.title }}</h3>
    <p>{{ article.description }}</p>
    {% if article.author || article.date %}
        <p>
            {% if article.author %}
                {{ article.author.name }}
                {{ article.author.email ? " (" + article.author.email + ")" : "" }}
            {% endif %}
            {% if article.date %}
                {{ new Date(article.date).toLocaleDateString() }}
            {% endif %}
         </p>
    {% endif %}
{% endforeach %}
`;

// Render your context with the template
// The result is trimmed since we are making HTML
const result = new TextJs(template, { trimResult: true }).render(context);
// Will return "<h3>Text Js is amazing !</h3><p>Why rendering templates using Function is amazing and more.</p><p>Nathan Prijot(nathanprijot@ipnosite.be)<span>04/01/2023</span></p>"
```

### Inline JavaScript

Inline JavaScript gives you access to the context you passed when rendering. Multiple variations are supported:

#### Single line output

All the properties in your context are directly available in inline JavaScript. If no `return` or `;` are present in the code, the result of the JavaScript will be directly dumped into the result. You also have direct access to the context itself.

```ts
const context = { text: "Hello !" };

const template = `{{ text }}{{ context.text }}{{ return context.text; }}`;

const result = new TextJs(template).render(context);
// Will return "Hello !Hello !Hello !"
```

#### Multiple line output

Inline JavaScript can also uses multiple lines. In that case you need to return the value that will be dumped yourself.

```ts
const context = { text: "Hello !" };

const template = `
{{ 
  const myText = text + "!!"; 
  return myText;
}}
    `;

const result = new TextJs(template, { trimResult: true }).render(context);
// Will return "Hello !!!"
```

#### Inline computation

With a `;` and no `return`. Inline JavaScript does not dump any value. But you can uses these code snippets to change or add properties to the context. However, as this example shows, be aware that the context is scoped for each block and that direct property access have limitations.

```ts
const template = `
{{ context.value = 1; }}
{% foreach item in [0, 1, 2, 3] %}
  {{ context.value += 1; }}
{% endforeach %}
{{ value += 1; }}
{{ context.value += 1; }}
{{ value }}
    `;

const result = new TextJs(template, { trimResult: true }).render();
// Will return "2"
// The context in the foreach is scoped to the foreach itself.
// The ability to directly access the context property is a syntax sugar but of course affecting that property will not affect the actual context value.
```

### Available statements

List of available statements:

- [if, elseif, else, endif](#if-elseif-else-endif)
- [foreach, endforeach](#foreach-endforeach)
- [switch, case, default, endswitch](#switch-case-default-endswitch)

#### if, elseif, else, endif

Allows conditioning. The format is the following: `if {JavaScript}` and `elseif {JavaScript}`.

```ts
new TextJs(`
    {% if foobar === "foo" %}
      Foo
    {% elseif foobar === "bar" %}
      Bar
    {% else %}
      Else
    {% endif %}
  `).render({ foobar: "foo" }, { trimResult: true });
// Will return "Foo"
```

#### foreach, endforeach

Allows the iteration of all the items in an array. The format is the following: `foreach {itemName}[, {indexName}] in {JavaScript}`. You can put any valid JavaScript that returns an array after the `in`. The `indexName` is optional. By default the name of the current index will be `index`.

```ts
new TextJs(`
    {% foreach item, index in array %}
      {{index + 1}}. {{ item }}
    {% endforeach %}
  `).render({ array: ["foo", "bar"] }, { trimResult: true });
// Will return "1. foo2. bar"
```

#### switch, case, default, endswitch

Allows to switch on a property. The case value allows dynamic values. The format is the following: `switch {JavaScript}` and `case {JavaScript}`.

Static cases values example:

```ts
new TextJs(`
    {% switch foobar %}
      {% case "foo" %}
        Foo
      {% case "bar" %}
        Bar
      {% default %}
        Default
    {% endswitch %}
  `).render({ foobar: "foo" }, { trimResult: true });
// Will return "Foo"
```

Dynamic cases values example:

```ts
new TextJs(`
    {% switch foobar %}
      {% case fooCase %}
        Foo
      {% case barCase %}
        Bar
    {% endswitch %}
  `).render(
  { foobar: "bar", fooCase: "foo", barCase: "bar" },
  { trimResult: true }
);
// Will return "Bar"
```

### Option

#### Trim result

By default, Text Js will not remove any of the white-spaces from the template. The `trimResult` option will remove all the lines returns and all the white-spaces at the start and end of each line:

```ts
new TextJs(
  `
    {{text}}   {{text}}
  `,
  { trimResult: true }
).render({
  text: "Hello",
});
// Will return "Hello   hello"
```

If you still need lines returns or white-spaces, you can insert them with a JavaScript snippet:

```ts
new TextJs(`Text{{"\\n"}}Text`).render();
// Will return "Text\nText" (where "\n" is an actual line return in the string)
```

#### Custom delimiters

By default, Text Js uses `{%` and `%}` for statements. It also uses `{{` and `}}` for inline JavaScript. This can be easily changed via the options provided by the constructor:

```ts
const customDelimitersOptions: ITextJsOptions = {
  delimiters: {
    jsStartDelimiter: "?%",
    jsEndDelimiter: "%?",
    statementStartDelimiter: "??",
    statementEndDelimiter: "??",
  },
};

const customDelimitersTemplate =
  "??foreach item in array???%item%???endforeach??";

new TextJs(customDelimitersTemplate, customDelimitersOptions).render({
  array: ["He", "ll", "o !"],
});
// Will return "Hello !"
```

#### Custom keywords

You can also change the keyword used for each statement:

```ts
const customStatementsOptions: ITextJsOptions = {
  statements: {
    if: "IF",
    elseIf: "ELSEIF",
    else: "ELSE",
    endIf: "ENDIF",
    forEach: "FOREACH",
    endForEach: "ENDFOREACH",
    switch: "SWITCH",
    case: "CASE",
    default: "DEFAULT",
    endSwitch: "ENDSWITCH",
  },
};

const customStatementsTemplate =
  "{%IF bool%}Hello !{%ELSEIF otherBool%}Goodbye !{%ELSE%}Hi !{%ENDIF%}{%FOREACH item in array%}{{item}}{%ENDFOREACH%}{%SWITCH hello%}{%CASE 1%}Hello !{%DEFAULT%}Goodbye !{%ENDSWITCH%}";

new TextJs(customStatementsTemplate, customStatementsOptions).render({
  bool: null,
  otherBool: false,
  array: ["Hel", "lo !"],
  hello: 1,
});
// Will return "Hi !Hello !Hello !"
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
