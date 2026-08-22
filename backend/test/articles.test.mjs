// Checks the reading section's essays.
//
// The essays link into practices — "try cyclic sighing" — by technique id.
// Those ids live in backend/lib/grounding.js and nothing but this test
// connects the two, so renaming a technique would leave a link that looks
// fine, builds fine, and lands on a "not found" page. An article that
// recommends something and then fails to open it is worse than one that never
// offered.

import assert from 'node:assert/strict';
import { ARTICLES } from '../../frontend/src/lib/articles.js';
import { TOPICS } from '../../frontend/src/lib/articles.js';
import { TECHNIQUE_IDS } from '../lib/grounding.js';

const ids = ARTICLES.map((a) => a.id);
assert.equal(new Set(ids).size, ids.length, `duplicate article ids: ${ids.join(', ')}`);

for (const article of ARTICLES) {
  const where = `article "${article.id}"`;

  for (const field of ['title', 'standfirst', 'topic']) {
    assert.ok(
      typeof article[field] === 'string' && article[field].trim(),
      `${where}: missing ${field}`,
    );
  }
  assert.ok(
    Number.isInteger(article.minutes) && article.minutes > 0,
    `${where}: minutes must be a positive integer`,
  );
  assert.ok(TOPICS[article.topic], `${where}: unknown topic "${article.topic}"`);
  assert.ok(Array.isArray(article.sections) && article.sections.length, `${where}: no sections`);
  assert.ok(Array.isArray(article.sources), `${where}: sources must be an array`);

  for (const section of article.sections) {
    assert.ok(section.heading?.trim(), `${where}: a section has no heading`);
    assert.ok(
      Array.isArray(section.blocks) && section.blocks.length,
      `${where}: section "${section.heading}" has no blocks`,
    );

    for (const block of section.blocks) {
      const kind = ['p', 'list', 'note', 'practice'].find((k) => block[k] !== undefined);
      assert.ok(kind, `${where}: a block in "${section.heading}" has no recognised type`);

      // The one that actually matters: a practice link must resolve.
      if (kind === 'practice') {
        assert.ok(
          TECHNIQUE_IDS.includes(block.practice),
          `${where}: links to grounding technique "${block.practice}", which does not exist. ` +
            `Valid ids: ${TECHNIQUE_IDS.join(', ')}`,
        );
        assert.ok(block.label?.trim(), `${where}: practice link to "${block.practice}" has no label`);
      }

      if (kind === 'list') {
        assert.ok(
          Array.isArray(block.list) && block.list.length,
          `${where}: an empty list in "${section.heading}"`,
        );
      }
    }
  }

  for (const source of article.sources) {
    assert.ok(source.label?.trim(), `${where}: a source has no label`);
    if (source.url) {
      assert.ok(
        /^https?:\/\//.test(source.url),
        `${where}: source url is not a url — "${source.url}"`,
      );
    }
  }
}

const byTopic = ARTICLES.reduce((counts, a) => {
  counts[a.topic] = (counts[a.topic] || 0) + 1;
  return counts;
}, {});

console.log(
  `article checks passed — ${ARTICLES.length} essays (${Object.entries(byTopic)
    .map(([t, n]) => `${n} ${t}`)
    .join(', ')}), all practice links resolve`,
);
