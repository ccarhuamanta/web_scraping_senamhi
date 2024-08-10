import fetch from 'node-fetch';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';

const API_KEY = "da9c78628b9fa2368cda0fce1408fe24";
const URL = "https://www.senamhi.gob.pe/?p=pronostico-meteorologico";

async function main(){
    const response = await fetch(`http://api.scraperapi.com/?api_key=${API_KEY}&url=${URL}&render=true`);
    const data = await response.text();
    await fs.writeFile('output.html', data);
    // console.log(data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(data);

    const datalinks = await page.evaluate(()=>{
        const urls = new Set();

        function extractUrlsFromAttributes() {
            document.querySelectorAll('[href], [src], [data-url]').forEach(element => {
                ['href', 'src', 'data-url'].forEach(attr => {
                    const url = element.getAttribute(attr);
                    if (url && url.startsWith('http')) {
                        urls.add(url);
                    }
                });
            });
        };

        function extractUrlsFromInlineJavaScript() {
            document.querySelectorAll('script').forEach(script => {
                const content = script.textContent || '';
                const matches = content.match(/http[s]?:\/\/[^\s"'<>]+/g);
                if (matches) {
                    matches.forEach(url => urls.add(url));
                }
            });
        };

        function extractUrlsFromTextContent() {
            const bodyText = document.body.innerHTML;
            const matches = bodyText.match(/http[s]?:\/\/[^\s"'<>]+/g);
            if (matches) {
                matches.forEach(url => urls.add(url));
            }
        }

        extractUrlsFromAttributes();
        extractUrlsFromInlineJavaScript();
        extractUrlsFromTextContent();
        
        return Array.from(urls);
    });

    console.log(datalinks);

    //Write in csv
    let csvHeader = 'Enlaces utilizados en la página';
    const csvContent = datalinks.join('\n---\n');

    await fs.writeFile('senamhi.csv', `${csvHeader}\n${csvContent}`);
    await browser.close();
}

main();