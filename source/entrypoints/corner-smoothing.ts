import { squircleObserver } from 'corner-smoothing';

const roundedElements = document.querySelectorAll<HTMLElement>('.rounded');
roundedElements.forEach((element) => {
    // get the css border radius value
    const borderRadius = window.getComputedStyle(element).borderRadius;
    element.style.borderRadius = '0';
    // convert it to a number

    const borderWidth = parseInt(window.getComputedStyle(element).borderWidth, 10);
    element.style.borderWidth = '0';

    const radius = parseInt(borderRadius, 10);
    // render the squircle

    const options: any = {
        cornerSmoothing: 0.6,
        cornerRadius: radius,
        borderRadius: 0,
        borderWidth: 0
    };
    if (borderWidth) options.borderWidth = borderWidth;

    squircleObserver(element, options)()
})