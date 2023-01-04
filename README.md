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
import { TextJs } from "text-js";

// Specify a context
const context = {
    articles: [
        title: "Test Js is amazing !",
        description: "Why rendering templates using Function is amazing and more.",
        author: {
            name: "Nathan Prijot",
            email: "nathanprijot@live.be"
        },
        date: "01-04-23"
    ]
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
                {{ article.author.email ? "(" + article.author.email + ")" : "" }}
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
```

## Statements

### If with else if and else

```
{% if foo %}
    Foo content
{% elseif bar %}
    Bar content
{% else %}
    Else content
{% endif %}
```

### Foreach

```
{% foreach item, index in array %}
    {{index + 1}}. {{ item }}
{% endforeach %}
```

### Switch

```
{% switch foobar %}
    {% case "bar" %}
        Foo content
    {% case "foo" %}
        Bar content
    {% default %}
        Default content
{% endswitch %}
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
