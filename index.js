const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const readline = require('readline');
const Table = require('cli-table');
const fs = require('fs');
const table = new Table({
    head: ['Nome', 'Número de Telefone', 'Status']
});


(async () => {
    try {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
            headless: true
        });

        // Use o navegador aqui

        await browser.close();
    } catch (error) {
        console.error(error);
    }
})();


const client = new Client({
    authStrategy: new LocalAuth({ clientid: 'session' })
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function centralizarTexto(texto) {
    const larguraTela = process.stdout.columns;
    const espacosEsquerda = (larguraTela - texto.length) / 2;
    return ' '.repeat(espacosEsquerda) + texto;
}

var data = new Date();
var dia = data.getDate();
var mes = data.getMonth() + 1;
var ano = data.getFullYear();
var dataAtual = dia + '/' + mes + '/' + ano;

console.log(centralizarTexto('#########################################'));
console.log(centralizarTexto('#                                       #'));
console.log(centralizarTexto('#    SEJA BEM VINDO AO BOT DA IGREJA    #'));
console.log(centralizarTexto('#             BIBLICA ISRAEL            #'));
console.log(centralizarTexto('#                                       #'));
console.log(centralizarTexto('#########################################'));



console.log(chalk.magenta('[INFO] Iniciando o bot...'));

//Inicializar o WhatsApp
client.initialize();

client.on('qr', (qrCode) => {
    console.clear();
    qrcode.generate(qrCode, { small: true });
    console.log(chalk.yellow('[OK] QR code recebido, aguardando escaneamento...'));
    console.log('\n');
});


client.on('authenticated', () => {
    console.log(chalk.green('[SUCCESS] Login autenticado!'));
});

client.on('auth_failure', message => {
    console.log(chalk.red('[FAILURE] Login falhou!'));
});

//verificar se desconectou do whatsapp
client.on('disconnected', (reason) => {
    console.log(chalk.red('[DISCONNECTED] Desconectado do WhatsApp!'));
    console.log(chalk.red('[DISCONNECTED] Motivo: ' + reason));
    console.log(chalk.red('[DISCONNECTED] Tentando reconectar...'));
    client.initialize();
});


const buscarMensagensAniversario = async () => {
    try {
        // Requisição GET para a API de aniversários
        const response = await axios.get('https://crm.biblicaisrael.com.br/api/birthdays.php');

        if (response.status === 200) {
            const aniversarios = response.data;

            for (const aniversario of aniversarios) {
                const nome = aniversario.nome;
                const numeroTelefone = aniversario.numeroTelefone;
                const mensagem = aniversario.textMessage;

                //se nao tiver nenhum aniversariante no dia, nao envia mensagem
                if (nome == null) {
                    console.log(chalk.red('[!] Nenhum aniversariante no dia de hoje (' + dataAtual + ')!'));
                    break;
                } else {

                    /*  client.sendMessage(`${numeroTelefone}@c.us`, mensagem);
                     console.log(chalk.green(`Mensagem de aniversário enviada para ${nome} (${numeroTelefone})`));
*/


                    client.sendMessage(`${numeroTelefone}@c.us`, mensagem).then(() => {
                        console.log(chalk.green(`[✔] Mensagem de aniversário enviada para ${nome} (${numeroTelefone})`));
                    }).catch((error) => {
                        console.log(chalk.red(`[X] Erro ao enviar mensagem de aniversário para ${nome} (${numeroTelefone})`));
                        console.log(error);
                    });

                    /* console.log('\n');
                    console.log(chalk.green('[✔] Mensagens de aniversário enviadas com sucesso!')); */
                }
            }

        } else {
            console.log(chalk.red('[X] Falha ao obter dados da API de aniversários. Contate o programador!'));
            console.log(aniversarios.mensagem);
        }
    } catch (error) {
        console.log(chalk.red('[X] Erro ao fazer requisição para a API de aniversários:', error));
    }
};

client.on('ready', () => {
    console.log(chalk.blue('[READY] Robô pronto para uso!'));
    console.log(chalk.yellow('[INFO] Pressione Enter se quiser sair do programa!'));
    console.log('\n');

    // Chama a função inicialmente
    buscarMensagensAniversario();

    // Define um intervalo de tempo para chamar a função repetidamente
    setInterval(buscarMensagensAniversario, 86400000); // 86400000ms = 24 horas
});

