# Text Js

Text Js is a weird template language allowing you to put JavaScript code inside any kind of text. Generating HTML, XML, CSV or even JSON (as useless as it my sound) becomes an easy task.

## Features

Text Js support the following statements:

- If with else if and else
- For each
- Switch with case and default

## Install

```
npm install text-js-render
```

## Usage

```ts
import { TextJs } from "text-js-render";

// Specify a context
const context = {
  articles: [
    {
      title: "Test Js is amazing !",
      description:
        "Why rendering templates using Function is amazing and more.",
      author: {
        name: "Nathan Prijot",
        email: "nathanprijot@live.be",
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
const result = new TextJs(template).render(context);
// Will returns (line returns and spaces trimmed)
// <h3>Test Js is amazing !</h3>
// <p>Why rendering templates using Function is amazing and more.</p>
// <p>Nathan Prijot(nathanprijot@live.be)<span>04/01/2023</span></p>
```

## Statements

### If with else if and else

Typical conditioning. The format is the following: `if {JavaScript}` and `elseif {JavaScript}`.

```ts
new TextJs(`
    {% if foobar === "foo" %}
      Foo
    {% elseif foobar === "bar" %}
      Bar
    {% else %}
      Else
    {% endif %}
  `)
  .render({ foobar: "foo" })
  .trim(); // Trimmed to remove spaces and line returns
// Will return "Foo"
```

### Foreach

Typical iteration of all the items in the given array. The format is the following: `foreach {itemName}[, {indexName}] in {JavaScript}`. You can put any valid JavaScript that results into an array after the `in`. The `indexName` is optional. By default the name of the current index will be `index`.

```ts
new TextJs(`
    {% foreach item, index in array %}
      {{index + 1}}. {{ item }}
    {% endforeach %}
  `)
  .render({ array: ["foo", "bar"] })
  .replace(/\s{2,}|\n/gm, ""); // Trimmed to remove spaces and line returns
// Will return "1. foo2. bar"
```

### Switch

Typical switch that allow dynamic case values. The format is the following: `switch {JavaScript}` and `case {JavaScript}`.

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
  `)
  .render({ foobar: "foo" })
  .trim(); // Trimmed to remove spaces and line returns
// Will return "Foo"
```

Dynamic example:

```ts
new TextJs(`
    {% switch foobar %}
      {% case fooCase %}
        Foo
      {% case barCase %}
        Bar
    {% endswitch %}
  `)
  .render({ foobar: "bar", fooCase: "foo", barCase: "bar" })
  .trim(); // Trimmed to remove spaces and line returns
// Will return "Bar"
```

### Options

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
// Will output "Hi !Hello !Hello !"
```
