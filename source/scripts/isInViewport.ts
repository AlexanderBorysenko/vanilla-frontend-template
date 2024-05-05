export const isInViewport = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const vertInView = (rect.top <= windowHeight && rect.top + rect.height >= 0) || (rect.top >= 0 && rect.bottom <= windowHeight);
    return vertInView;
}

export const isInViewportByOffsetTopAndHeight = (offsetTop: number, height: number) => {
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowTop = window.scrollY || document.documentElement.scrollTop;

    const elementTopVisible = offsetTop >= windowTop && offsetTop < windowTop + windowHeight;

    const elementBottomVisible = offsetTop + height > windowTop && offsetTop + height <= windowTop + windowHeight;

    const elementFullyVisible = (offsetTop < windowTop && offsetTop + height > windowTop + windowHeight);

    return elementTopVisible || elementBottomVisible || elementFullyVisible;
}