export function byStringSelector(selector) {
    return (a, b) => selector(a).localeCompare(selector(b));
}