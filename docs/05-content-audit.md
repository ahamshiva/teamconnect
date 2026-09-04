# Content fact audit

**Audited:** 2026-09-04 · **Scope:** every item at difficulty 2 or 3 in the four banks that assert
something true and get read aloud. **Result: 160 items checked, 1 correction.**

## Why these 160

The knowledge games now carry a `difficultyMin` of 2, so every session draws from the medium and hard
end. That concentrates real sessions onto exactly the claims most likely to be challenged by a colleague
who knows the subject, which is why the audit was scoped there rather than across the whole bank.

| Bank | Audited | Errors | What the facilitator reads aloud |
|---|---:|---:|---|
| `quiz` | 55 | 0 | A question, four options, and the right answer |
| `factfiction` | 40 | 1 | A claim, then TRUE/FALSE and the real story |
| `wronganswers` | 33 | 0 | The real answer plus a "fun fact" |
| `balderdash` | 32 | 0 | The real definition of a word |
| **Total** | **160** | **1** | |

`gibberish` and `fivesec` are excluded on purpose: they assert nothing. A gibberish puzzle is a decoding
task and a five-second prompt is "name three things", so neither can be factually wrong. `rankit`,
`charades` and `wyr` keep their full banks and were not filtered, so they are not concentrated the way
the four above are.

## The one correction

`factfiction_?` — kangaroos cannot hop backwards. The claim itself is right; the explanation ended
"...which is why they face forward on the coat of arms", which is a non-sequitur (facing forward in
heraldry is not caused by hopping) and quietly states as fact something that has never been official.
The popular story is that the kangaroo and emu were *chosen* because neither moves backwards easily.
Reworded to say exactly that, and to say it is unofficial.

## What the audit found in the banks' favour

Worth recording, because it changes how much these banks should be trusted in future:

- **Uncertain origins are hedged rather than asserted.** "Bless you" says Pope Gregory I is *often
  credited* and the fun fact admits there is no single proven origin. "Knock on wood" says the trail goes
  cold after the 1800s. That is the right posture for folk etymology.
- **Several items actively debunk myths** instead of repeating them: Napoleon's height, Viking horned
  helmets, glass flowing in old windows, the Great Wall from space, the yo-yo as an ancient Filipino
  weapon, and the first computer "bug" (the term predates the 1947 moth).
- **The riskiest questions are already defended.** The Venus retrograde-rotation question carries a note
  reading "Uranus also rotates the odd way round but on its side. Venus is the classic answer", and
  Uranus is deliberately not among the options. The Nile is "by most measurements", side-stepping the
  Amazon dispute. Snooker's 147 is qualified as a "standard frame", side-stepping the 155 free-ball case.

## Limits of this audit

- It covers built-in content at difficulty 2 and 3 **as of 2026-09-04**. Custom items added through the
  Content Manager, and imported packs, are not covered and never will be by this pass.
- Difficulty 1 items were not audited. They are currently unreachable in the six floored games, but they
  become reachable again the moment anyone lowers `difficultyMin` on an activity.
- No `verified` field was added to the items. Marking 160 records to encode one clean pass would be a
  large diff carrying little information; this document plus the date is the record.
