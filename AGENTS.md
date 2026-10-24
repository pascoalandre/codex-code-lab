<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Code runs on the .NET 8 engine first (modern C#: switch expressions, records, patterns) with Mono as an automatic fallback; why: Mono only understands C# 7.
- Modern-engine source gets implicit `global using` lines plus `#line 1`; why: diagnostics then point at the user's own line numbers without a line map.
