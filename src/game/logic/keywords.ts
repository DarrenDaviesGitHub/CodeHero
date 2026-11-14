export const LANGUAGES = ['csharp', 'typescript', 'javascript', 'html', 'css', 'go', 'python'] as const;

export type Language = (typeof LANGUAGES)[number];

export interface LanguageInfo {
  readonly id: Language;
  readonly label: string;
  readonly badge: string;
  readonly color: number;
  readonly css: string;
}

const info = (id: Language, label: string, badge: string, color: number): LanguageInfo => ({
  id,
  label,
  badge,
  color,
  css: `#${color.toString(16).padStart(6, '0')}`,
});

export const LANGUAGE_INFO: Readonly<Record<Language, LanguageInfo>> = {
  csharp: info('csharp', 'C#', 'C#', 0xb15cff),
  typescript: info('typescript', 'TypeScript', 'TS', 0x3d9bff),
  javascript: info('javascript', 'JavaScript', 'JS', 0xffe03d),
  html: info('html', 'HTML', 'HTML', 0xff7a3d),
  css: info('css', 'CSS', 'CSS', 0xff3df0),
  go: info('go', 'Go', 'GO', 0x00f0d0),
  python: info('python', 'Python', 'PY', 0x5cff6a),
};

const words = (s: string): readonly string[] => s.trim().split(/\s+/);

export const KEYWORDS: Readonly<Record<Language, readonly string[]>> = {
  csharp: words(`
    abstract as base bool break byte case catch char checked class const continue decimal
    default delegate do double else enum event explicit extern false finally fixed float for
    foreach goto if implicit in int interface internal is lock long namespace new null object
    operator out override params private protected public readonly ref return sbyte sealed short
    sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked
    unsafe ushort using virtual void volatile while async await var dynamic yield record init
    required nameof when where get set value partial global nint notnull scoped file
  `),
  typescript: words(`
    type interface enum namespace declare abstract implements readonly keyof typeof infer unknown
    never any as is satisfies private public protected module number string boolean symbol bigint
    asserts override accessor Partial Record Readonly Pick Omit Exclude Extract Awaited ReturnType
    NonNullable Required unique
  `),
  javascript: words(`
    var let const function return if else for while do break continue switch case default try
    catch finally throw new delete typeof instanceof in of class extends super this import export
    from async await yield void null undefined true false debugger static get set NaN Infinity
    Promise JSON console Symbol globalThis arguments
  `),
  html: words(`
    html head body div span header footer main nav section article aside h1 p a img ul ol li
    table tr td th form input button label select option textarea canvas video audio source
    script style link meta title iframe template slot dialog details summary figure figcaption
    picture strong em code pre br hr blockquote href src alt aria-label data-id tabindex srcset
    onclick defer crossorigin <div> <span> <img> <slot> <template> <dialog> <canvas>
  `),
  css: words(`
    color margin padding border display flex grid position absolute relative sticky z-index
    opacity transform transition animation @media @keyframes @import @supports @layer @container
    !important :root :hover :focus ::before ::after rem vh calc var clamp rgba hsl gap
    justify-content align-items overflow cursor filter inherit initial unset font-size box-shadow
    backdrop-filter inset aspect-ratio
  `),
  go: words(`
    break case chan const continue default defer else fallthrough for func go goto if import
    interface map package range return select struct switch type var nil iota make len cap append
    copy panic recover string int64 float64 rune byte error bool uint8 any comparable close new
  `),
  python: words(`
    False None True and as assert async await break class continue def del elif else except
    finally for from global if import in is lambda nonlocal not or pass raise return try while
    with yield self print range len dict list tuple set match case __init__ isinstance enumerate
    zip super staticmethod @property kwargs args
  `),
};

export interface Keyword {
  readonly text: string;
  readonly language: Language;
  readonly difficulty: number;
}

export function difficultyOf(text: string): number {
  const symbols = text.replace(/[a-z0-9]/gi, '').length;
  return text.length + symbols * 2;
}

export const ALL_KEYWORDS: readonly Keyword[] = LANGUAGES.flatMap((language) =>
  KEYWORDS[language].map((text) => ({ text, language, difficulty: difficultyOf(text) })),
);
