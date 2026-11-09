import { communityLinks, issueUrl } from '../community/links';

describe('community links', () => {
  it('checks the links and hides what is missing', () => {
    expect(communityLinks({ github: 'https://github.com/a/b/', discord: '' })).toEqual({
      github: 'https://github.com/a/b',
      discord: null,
    });
    expect(communityLinks({})).toEqual({ github: null, discord: null });
    expect(communityLinks().discord).toMatch(/^https:\/\/discord\.gg\//);
    expect(communityLinks({ discord: 'javascript:alert(1)' }).discord).toBeNull();
  });

  it('opens the bug form with the version and the device filled in', () => {
    const url = issueUrl('https://github.com/a/b', 'bug', { version: '1.0.0', platform: 'iOS 18' });
    expect(url).toBe(
      'https://github.com/a/b/issues/new?template=bug.yml&version=1.0.0&device=iOS+18',
    );
    expect(issueUrl('https://github.com/a/b', 'idea', { version: '1', platform: 'Web' })).toBe(
      'https://github.com/a/b/issues/new?template=idea.yml',
    );
  });
});
