import * as ActionNames from '../ActionNames.mjs';

export default function filterActions(searchTerm, allActions) {
  const lowerTerm = searchTerm.toLowerCase();

  if (lowerTerm.startsWith('/tabs')) {
    const tempvalue = searchTerm.replace(/\/tabs\s*/, '').toLowerCase();
    return allActions.filter(
      (a) =>
        a.type === 'tab' &&
                (a.title.toLowerCase().includes(tempvalue) ||
                    a.url.toLowerCase().includes(tempvalue))
    );
  } else if (lowerTerm.startsWith('/actions')) {
    const tempvalue = lowerTerm.replace(/\/actions\s*/, '');
    return allActions.filter(
      (a) => a.type === 'action' && a.title.toLowerCase().includes(tempvalue)
    );
  } else if (lowerTerm.startsWith('/remove')) {
    const tempvalue = lowerTerm.replace(/\/remove\s*/, '');
    return allActions.filter(
      (a) =>
        (a.type === 'action' || a.type === 'tab') &&
                (a.title.toLowerCase().includes(tempvalue) ||
                    a.url?.toLowerCase().includes(tempvalue))
    );
  }

  const splitSearchTerm = lowerTerm.split(' ');
  const firstWord = splitSearchTerm[0];
  const customActions = allActions.filter((a) => a.action === ActionNames.CustomSearch);
  const customAction = customActions.find((a) => firstWord === a.shortcut);

  return allActions.filter(
    (action) =>
      action.title.toLowerCase().includes(lowerTerm) ||
            action.url?.toLowerCase().includes(lowerTerm) ||
            action.shortcut === firstWord
  ).map(action => {
    if (action === customAction && splitSearchTerm.length > 1) {
      const urlTemplate = action.url;
      const searchValue = searchTerm.split(' ').slice(1).join(' ');
      // mutate the custom action into an action and to include the search term
      return {
        ...action,
        desc: searchValue
          ? `Search ${action.title} for "${searchValue}"`
          : `Search ${action.title}`,
        type: 'action',
        url: urlTemplate.replace('{searchTerms}', encodeURIComponent(searchValue)),
        action: 'url',
      };
    }
    return action;
  });
}