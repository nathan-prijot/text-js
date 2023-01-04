import { ITextJsOptions, TextJs } from "../src/index";

describe("text", () => {
  it("basic", () => {
    expect(new TextJs("Hello !").render()).toBe("Hello !");
  });

  it("single character", () => {
    expect(new TextJs("H").render()).toBe("H");
  });

  it("no template", () => {
    expect(new TextJs().render()).toBe("");
  });
});

describe("js", () => {
  it("basic", () => {
    expect(new TextJs("{{'Hello !'}}").render()).toBe("Hello !");
  });

  it("brackets", () => {
    expect(new TextJs("{{{text: 'Hello !'}.text}}").render()).toBe("Hello !");
  });

  it("multiline", () => {
    expect(
      new TextJs("{{const text = 'Hello !';\nreturn text;}}").render()
    ).toBe("Hello !");
  });

  it("multiline no ;", () => {
    expect(new TextJs("{{const text = 'Hello !'\nreturn text}}").render()).toBe(
      "Hello !"
    );
  });

  it("inline with ;", () => {
    expect(new TextJs("{{const text = 'Hello !';return text}}").render()).toBe(
      "Hello !"
    );
  });

  it("error in", () => {
    expect(() => new TextJs("{{null.hello}}").render()).toThrowError(
      /Internal error in 'return null\.hello;'\: .+/
    );
  });

  it("error missing start delimiter", () => {
    expect(() => new TextJs("}}").render()).toThrowError(
      "Missing delimiter: '{{'"
    );
  });

  it("error missing end delimiter", () => {
    expect(() => new TextJs("{{").render()).toThrowError(
      "Missing delimiter: '}}'"
    );
  });

  it("error missing end delimiter content", () => {
    expect(() => new TextJs("{{}}Hello{{").render()).toThrowError(
      "Missing delimiter: '}}'"
    );
  });
});

describe("statement", () => {
  it("error missing start delimiter", () => {
    expect(() => new TextJs("%}").render()).toThrowError(
      "Missing delimiter: '{%'"
    );
  });

  it("error missing end delimiter", () => {
    expect(() => new TextJs("{%").render()).toThrowError(
      "Missing delimiter: '%}'"
    );
  });

  it("error unknown end delimiter", () => {
    expect(() => new TextJs("{%hello%}").render()).toThrowError(
      "Unknown statement: 'hello'"
    );
  });
});

describe("if", () => {
  const basic = "{%if bool%}Hello !{%endif%}";

  it("basic true", () => {
    expect(new TextJs(basic).render({ bool: true })).toBe("Hello !");
  });

  it("basic false", () => {
    expect(new TextJs(basic).render({ bool: false })).toBe("");
  });

  const nested = "{%if bool%}{%if bool%}Hello !{%endif%}{%endif%}";

  it("nested true", () => {
    expect(new TextJs(nested).render({ bool: true })).toBe("Hello !");
  });

  it("error missing if with endif", () => {
    expect(() => new TextJs("{%endif%}").render()).toThrowError(
      "Missing statement: 'if'"
    );
  });

  it("error missing if with elseif", () => {
    expect(() => new TextJs("{%elseif%}").render()).toThrowError(
      "Missing statement: 'if'"
    );
  });

  it("error missing if with else", () => {
    expect(() => new TextJs("{%else%}").render()).toThrowError(
      "Missing statement: 'if'"
    );
  });

  it("error missing endif", () => {
    expect(() => new TextJs("{%if bool%}").render()).toThrowError(
      "Missing statement: 'endif'"
    );
  });
});

describe("else", () => {
  const basic = "{%if bool%}Hello !{%else%}Goodbye !{%endif%}";

  it("basic true", () => {
    expect(new TextJs(basic).render({ bool: true })).toBe("Hello !");
  });

  it("basic false", () => {
    expect(new TextJs(basic).render({ bool: false })).toBe("Goodbye !");
  });

  const nested =
    "{%if bool%}Hello !{%else%}{%if !bool%}Goodbye !{%endif%}{%endif%}";

  it("nested false", () => {
    expect(new TextJs(nested).render({ bool: false })).toBe("Goodbye !");
  });

  it("error else not last", () => {
    expect(() =>
      new TextJs("{%if%}{%else%}{%elseif%}{%endif%}").render()
    ).toThrowError(
      "Invalid statement: 'else' must be the last element of 'if'"
    );
  });

  it("error duplicate else", () => {
    expect(() =>
      new TextJs("{%if%}{%else%}{%else%}{%endif%}").render()
    ).toThrowError("Invalid statement: duplicate 'else' in 'if'");
  });
});

describe("elseif", () => {
  const basic = "{%if bool%}Hello !{%elseif !bool%}Goodbye !{%endif%}";

  it("basic true", () => {
    expect(new TextJs(basic).render({ bool: true })).toBe("Hello !");
  });

  it("basic false", () => {
    expect(new TextJs(basic).render({ bool: false })).toBe("Goodbye !");
  });
});

describe("foreach", () => {
  const basic = "{%foreach item in array%}{{item}}{%endforeach%}";

  it("basic", () => {
    expect(new TextJs(basic).render({ array: ["He", "ll", "o !"] })).toBe(
      "Hello !"
    );
  });

  const indexDefault =
    "{%foreach item in array%}{{array[index]}}{%endforeach%}";

  it("index default", () => {
    expect(
      new TextJs(indexDefault).render({ array: ["He", "ll", "o !"] })
    ).toBe("Hello !");
  });

  const indexRenamed =
    "{%foreach item, hello in array%}{{array[hello]}}{%endforeach%}";
  it("index renamed", () => {
    expect(
      new TextJs(indexRenamed).render({ array: ["He", "ll", "o !"] })
    ).toBe("Hello !");
  });

  const nested =
    "{%foreach subArray in array%}{%foreach item in subArray%}{{item}}{%endforeach%}{%endforeach%}";
  it("nested", () => {
    expect(
      new TextJs(nested).render({ array: [["He"], ["ll", "o !"], []] })
    ).toBe("Hello !");
  });

  it("error not array", () => {
    expect(() => new TextJs(basic).render({ array: "Hello !" })).toThrowError(
      "Incompatible argument: 'return array;' is not an array"
    );
  });

  it("error missing foreach", () => {
    expect(() => new TextJs("{%endforeach%}").render()).toThrowError(
      "Missing statement: 'foreach'"
    );
  });

  it("error missing endforeach", () => {
    expect(() => new TextJs("{%foreach array%}").render()).toThrowError(
      "Missing statement: 'endforeach'"
    );
  });
});

describe("switch", () => {
  const basic =
    "{%switch hello%}{%case 1%}Hello !{%case 2%}Goodbye !{%default%}Hi !{%endswitch%}";

  it("basic 1", () => {
    expect(new TextJs(basic).render({ hello: 1 })).toBe("Hello !");
  });

  it("basic 2", () => {
    expect(new TextJs(basic).render({ hello: 2 })).toBe("Goodbye !");
  });

  it("basic default", () => {
    expect(new TextJs(basic).render({ hello: 3 })).toBe("Hi !");
  });

  const noDefault =
    "{%switch hello%}{%case 1%}Hello !{%case 2%}Goodbye !{%endswitch%}";

  it("no default", () => {
    expect(new TextJs(noDefault).render({ hello: 3 })).toBe("");
  });

  const text =
    "{%switch hello%}{%case 'hello'%}Hello !{%case 'goodbye'%}Goodbye !{%endswitch%}";

  it("text", () => {
    expect(new TextJs(text).render({ hello: "goodbye" })).toBe("Goodbye !");
  });

  const variable =
    "{%switch hello%}{%case helloCase%}Hello !{%case goodbyeCase%}Goodbye !{%endswitch%}";

  it("text", () => {
    expect(
      new TextJs(variable).render({
        hello: "goodbye",
        helloCase: "hello",
        goodbyeCase: "goodbye",
      })
    ).toBe("Goodbye !");
  });

  it("error missing switch with endswitch", () => {
    expect(() => new TextJs("{%endswitch%}").render()).toThrowError(
      "Missing statement: 'switch'"
    );
  });

  it("error missing switch with case", () => {
    expect(() => new TextJs("{%case%}").render()).toThrowError(
      "Missing statement: 'switch'"
    );
  });

  it("error missing switch with default", () => {
    expect(() => new TextJs("{%default%}").render()).toThrowError(
      "Missing statement: 'switch'"
    );
  });

  it("error default not last", () => {
    expect(() =>
      new TextJs("{%switch%}{%default%}{%case%}{%endswitch%}").render()
    ).toThrowError(
      "Invalid statement: 'default' must be the last element of 'switch'"
    );
  });

  it("error duplicate default", () => {
    expect(() =>
      new TextJs("{%switch%}{%default%}{%default%}{%endswitch%}").render()
    ).toThrowError("Invalid statement: duplicate 'default' in 'switch'");
  });

  it("error missing endswitch", () => {
    expect(() => new TextJs("{%switch%}").render()).toThrowError(
      "Missing statement: 'endswitch'"
    );
  });

  const nested =
    "{%switch hello%}{%case 1%}{%switch%}Hello !{%endswitch%}{%case 2%}Goodbye !{%endswitch%}";

  it("nested", () => {
    expect(new TextJs(nested).render({ hello: 1 })).toBe("Hello !");
  });
});

describe("mixed", () => {
  const ifInForEach =
    "{%foreach item in array%}{%if item%}Hello !{%endif%}{%endforeach%}";

  it("if in foreach", () => {
    expect(new TextJs(ifInForEach).render({ array: [true, false, true] })).toBe(
      "Hello !Hello !"
    );
  });

  const ifElseIfElseInForEach =
    "{%foreach item in array%}{%if item.bool%}Hello !{%elseif item.otherBool%}Goodbye !{%else%}Hi !{%endif%}{%endforeach%}";

  it("if, elseif, else in foreach", () => {
    expect(
      new TextJs(ifElseIfElseInForEach).render({
        array: [
          { bool: true, otherBool: true },
          { bool: false, otherBool: false },
          { bool: false, otherBool: true },
        ],
      })
    ).toBe("Hello !Hi !Goodbye !");
  });

  const forEachInIf =
    "{%if array%}{%foreach item in array%}{{item}}{%endforeach%}{%endif%}";

  it("foreach in if", () => {
    expect(new TextJs(forEachInIf).render({ array: [3, 1, 2] })).toBe("312");
  });

  const switchInForEach =
    "{%foreach item in array%}{%switch item%}{%case 1%}Hello !{%case 2%}Goodbye !{%default%}Hi !{%endswitch%}{%endforeach%}";

  it("switch in forEach", () => {
    expect(new TextJs(switchInForEach).render({ array: [3, 2, 1] })).toBe(
      "Hi !Goodbye !Hello !"
    );
  });
});

describe("options", () => {
  const customDelimitersOptions: ITextJsOptions = {
    delimiters: {
      jsStartDelimiter: "?%",
      jsEndDelimiter: "%?",
      statementStartDelimiter: "??",
      statementEndDelimiter: "??",
    },
  };

  const customDelimiters = "??foreach item in array???%item%???endforeach??";

  it("custom delimiters", () => {
    expect(
      new TextJs(customDelimiters, customDelimitersOptions).render({
        array: ["He", "ll", "o !"],
      })
    ).toBe("Hello !");
  });

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

  const customStatements =
    "{%IF bool%}Hello !{%ELSEIF otherBool%}Goodbye !{%ELSE%}Hi !{%ENDIF%}{%FOREACH item in array%}{{item}}{%ENDFOREACH%}{%SWITCH hello%}{%CASE 1%}Hello !{%DEFAULT%}Goodbye !{%ENDSWITCH%}";

  it("custom statements", () => {
    expect(
      new TextJs(customStatements, customStatementsOptions).render({
        bool: null,
        otherBool: false,
        array: ["Hel", "lo !"],
        hello: 1,
      })
    ).toBe("Hi !Hello !Hello !");
  });
});
