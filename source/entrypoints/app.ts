import { initContactForm } from '../components/base-contact-form';
import { initIsInViewportElements } from '../scripts/isInViewport';
import { initLinkCards } from '../scripts/linkCards';
import '../styles/app.scss';

window.addEventListener('load', () => {
    initContactForm();
    initLinkCards();
    initIsInViewportElements();
});