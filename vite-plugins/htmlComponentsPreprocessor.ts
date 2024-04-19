import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = 'source/components'; // Directory for component templates

let availableComponentNames: string[] = [];

export default function htmlPreprocessorPlugin(): Plugin {
    availableComponentNames = resolveAvailableComponentNames();
    return {
        name: 'html-preprocessor',
        transform: transformCode,
        transformIndexHtml: transformHtml,
        configureServer: configureServer
    };
}

function configureServer(server: any): void {
    server.watcher.add(path.join(process.cwd() + '/' + COMPONENT_DIR));
    server.watcher.on('change', (file: string) => {
        if (file.includes(COMPONENT_DIR) && file.endsWith('.html')) {
            server.ws.send({
                type: 'full-reload'
            });
        }
    });
}

function transformCode(code: string, src: string): string {
    if (!src.endsWith('.html')) {
        return code;
    }

    const processedHtml = processHtml(code);
    return processedHtml;
}

function transformHtml(html: string): string {
    return processHtml(html);
}

function processHtml(html: string, propsToReplace:
    Record<string, string | object> = {}
): string {

    html = intrapolateProps(html, propsToReplace);

    html = handleHTMLForLoop(html);

    html = handleHTMLSelfClosingTags(html);

    html = handleHTMLComponentsWithInnerHTML(html);

    html = cleanUpUnusedProps(html);

    return html;
}

function resolveAvailableComponentNames(): string[] {
    const componentFiles = fs.readdirSync(COMPONENT_DIR);
    return componentFiles
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
}

function componentNameRegexPart(): string {
    return availableComponentNames.join('|');
}

function resolveComponentTemplate(tagName: string): string | null {
    const componentPath = path.join(COMPONENT_DIR, `${tagName}.html`);
    if (!fs.existsSync(componentPath)) return null;

    const componentTemplate = fs.readFileSync(componentPath, 'utf-8');

    return componentTemplate;
}

function isKeyValueObject(obj: any): boolean {
    return typeof obj === 'object' && !Array.isArray(obj);
}

function cleanUpUnusedProps(html: string): string {
    // seek for html tags with attributes like id="{{propName}}"
    let propsRegex: RegExp = /(\w+)="\{\{([\w.]+)\}\}"/g;

    html = html.replace(propsRegex, '');

    // seek for templates like aria-labelledby="{{propName}}-rest-of-template" and remove them
    propsRegex = /(\w+|[\w-]+)="\{\{([\w.]+)\}\}[^"]+"/g;
    html = html.replace(propsRegex, '');

    // seek for other props left in the template
    propsRegex = /\{\{([\w.]+)\}\}/g;
    html = html.replace(propsRegex, '');

    return html;
}

// props handling
// go throught {{propName}} and replace them with propValue
// handle nested objects like {{propName.propName2...}}
function intrapolateProps(html: string, propsToReplace: Record<string, string | object> = {}): string {
    const propsRegex = /\{\{([\w.]+)\}\}/g;

    return html.replace(propsRegex, (match, propName) => {
        const propValue = propName.split('.').reduce((acc:
            Record<string, string | object> | string | undefined
            , key:
                string
        ) => {
            if (isKeyValueObject(acc)) {
                return acc ? acc[key] : match;
            }
            return acc;
        }, propsToReplace);

        return propValue ?? match;
    });
}

function handleHTMLForLoop(
    html: string
): string {
    const forTagRegex = /<logic\s*:for="(\w+)\s+in\s+([^"]+)"\s*>([\s\S]*?)<\/logic>/g;

    html = html.replace(forTagRegex, (
        match: string,
        itemKey: string,
        itemsJson: string,
        innerHtml: string
    ) => {
        const items = (0, eval)(itemsJson);
        if (!Array.isArray(items)) {
            console.error('For loop items should be an array');
            return match;
        }

        let processedTemplate = '';
        for (let itemValue of items) {
            itemValue[itemKey] = itemValue;
            processedTemplate += processHtml(innerHtml, itemValue);
        }
        return processedTemplate;
    });

    return html;
}

function HTMLSelfClosingTagsReplace(match: string, tagName: string, propsString: string) {
    const componentTemplate = resolveComponentTemplate(tagName);
    if (!componentTemplate) return match;

    return processHtml(componentTemplate, parseProps(propsString));
}

function handleHTMLSelfClosingTags(
    html: string
): string {
    const selfClosingComponentRegex = new RegExp(
        `<(${componentNameRegexPart()})[\\s]([^>]*)\\s*\\/\\s*>`,
        'g'
    );

    return html.replace(selfClosingComponentRegex, HTMLSelfClosingTagsReplace
    );
}

function HTMLComponentsWithInnerHTMLReplace(
    match: string,
    tagName: string,
    propsString: string,
    innerHtml: string
) {
    const componentTemplate = resolveComponentTemplate(tagName);
    if (!componentTemplate) return match;

    let processedTemplate = componentTemplate;

    // process stage to handle local props
    processedTemplate = processHtml(componentTemplate, parseProps(propsString));

    // handle innerHTML
    processedTemplate = interpolateInnerHtml(processedTemplate, innerHtml);

    // process stage to handle innerHTML without local props
    processedTemplate = processHtml(processedTemplate);

    return processedTemplate;
}

function handleHTMLComponentsWithInnerHTML(
    html: string
): string {
    const componentWithInnerTagsRegex = new RegExp(
        `<(${componentNameRegexPart()})[\\s]*([^>]*)?>([\\s\\S]*?)<\\/(${componentNameRegexPart()})>`,
        'g'
    );

    return html.replace(
        componentWithInnerTagsRegex,
        HTMLComponentsWithInnerHTMLReplace
    );
}

function interpolateInnerHtml(template: string, innerHtml: string): string {
    return template.replace(/<slot\s*\/>/g, innerHtml);
}

function parseProps(propsString: string): Record<string, string> {
    const props: Record<string, string> = {};
    const propRegex = /(\w+)="([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = propRegex.exec(propsString))) {
        const [, propName, propValue] = match;
        props[propName] = propValue;
    }
    return props;
}
