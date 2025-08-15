import { CommentsAPI } from '@/comments/api/CommentsAPI';
import { EMOJIS } from '@/comments/core/rules';
import { makeScopeKey, Scope } from '@/comments/core/types';

export async function seedComments(perScope = 200) {
  const api = new CommentsAPI();
  const scopes: Scope[] = [
    { type: 'series', seriesSlug: 'demo-series' },
    { type: 'chapter', seriesSlug: 'demo-series', chapterNumber: 1 },
  ];
  const user = { id: 'demo', name: 'Demo User' };
  for (const scope of scopes) {
    for (let i = 0; i < perScope; i++) {
      await api.postComment(scope, user, { content: `Demo comment ${i} in ${makeScopeKey(scope)}` });
    }
  }
}
