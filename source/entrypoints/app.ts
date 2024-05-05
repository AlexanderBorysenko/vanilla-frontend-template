import { initContactForm } from '../components/base-contact-form';
import { initLinkCards } from '../scripts/linkCards';
import '../styles/app.scss';

window.addEventListener('load', () => {
    initContactForm();
    initLinkCards();
});