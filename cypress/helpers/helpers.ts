export const mockUser = {
  id: 1,
  name: 'TestUser',
  rank: 15,
  last_roulette_rank: 0,
  totalExp: 1000,
  latestCompletedGoals: [],
};

// どちらの Origin でもマッチ
export const currentUserRoute = /https?:\/\/(?:www\.)?plusoneup\.net\/api\/current_user(?:\?.*)?$|^\/api\/current_user(?:\?.*)?$/;
