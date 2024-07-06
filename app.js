const { updateProductList } = require('./src/services/updateProductList');
const { createLogMessage } = require('./src/utils/createLog');
const { listadoUrls } = require('./src/assets/ListadoUrlProductos');
const puppeteer = require('puppeteer');
const { generateCurrentDate } = require('./src/utils/generateCurrentDate'); 
const { cleanAndParseValue } = require('./src/utils/cleanAndParseValue'); 

async function getProductPrice(url, browser) {
    createLogMessage(`Inicio de la funcion getProductPrice para: ${url}`);
    let id = 0;
    let currentDate = generateCurrentDate();
    let parsedPrice = null;
    let product = null;

    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#DetalleProducto');
        const elementPrice = await page.$('.Detalle');
        const elementTitle = await page.$('#DetalleProducto h1');

        // Obtener titulo del producto
        const title = await elementTitle.evaluate(el => el.textContent.trim());

        const productPrice = await elementPrice.evaluate(() => {
            const elements = document.querySelectorAll('.DetVal');

            for (const element of elements) {
                if (element.textContent.includes('$')) {
                    return element.textContent.trim();
                }
            }
            return null;
        });

        if (productPrice) {
            parsedPrice = cleanAndParseValue(productPrice);
            id = url.split('=')[1];

            // Generar json para almacenar
            product = {
                id: id,
                title: title,
                currentPrice: parsedPrice,
                url: url,
                date: currentDate,
            };
        } else {
            product = null;
            createLogMessage(`No se pudo obtener el precio del producto: ${url}`);
        }

        await page.close();
        return product;

    } catch (error) {
        createLogMessage(`Error al conectarse a la web: ${error.message}`);
    }

    createLogMessage('Fin de la funcion getProductPrice');
    return null;
}

async function main() {
    let browser;

    try {
        createLogMessage('Inicio de script');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });

        if (!browser) {
            console.log('Error: El objeto browser es null');
            return; // Termina la ejecución de la función main
        }
        
        // Map para crear un array de promesas
        const promises = listadoUrls.map(async (url) => {
            let attempt = 0;
            const maxAttempts = 3;
            let success = false;

            while (attempt < maxAttempts && !success) {
                attempt++;
                try {
                    const productData = await getProductPrice(url, browser);
                    if (productData) {
                        await updateProductList(productData);
                        success = true; // Marca el intento como exitoso
                    } else {
                        createLogMessage(`No se encontraron datos para URL: ${url}`);
                    }
                } catch (error) {
                    createLogMessage(`Error procesando URL: ${url} - Intento ${attempt} - ${error.message}`);
                    if (attempt >= maxAttempts) {
                        createLogMessage(`Maximos intentos alcanzados para URL: ${url}`);
                    }
                }
            }
        });

        // Espera a que todas las promesas se resuelvan
        await Promise.all(promises);
        createLogMessage("El Script terminó de ejecutarse \n-------------------------------------------");

    } catch (error) {
        createLogMessage(`Error en main: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Ejecutar la función inmediatamente al iniciar
(async () => {
    await main();
})();
