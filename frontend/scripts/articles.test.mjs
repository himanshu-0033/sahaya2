// node scripts/articles.test.mjs
//
// The home page puts one sentence from each article in quotation marks. A
// quote the article does not actually contain is a misquote, and the edit that
// causes one is an ordinary rewording of a paragraph nobody thinks to check
// against the home screen. So each `pull` must appear word for word in its
// own article.
import assert from 'node:assert/strict';
import { ARTICLES } from '../src/features/read/articles.js';

for (const article of ARTICLES) {
  const text = article.sections
    .flatMap((s) => s.blocks.flatMap((b) => [b.p, b.note, ...(b.list || [])]))
    .join('\n');
  assert.ok(article.pull, `${article.id}: no pull quote`);
  assert.ok(text.includes(article.pull), `${article.id}: pull quote is not in the article`);
}

console.log(`articles: ${ARTICLES.length} pull quotes found word for word, ok`);
