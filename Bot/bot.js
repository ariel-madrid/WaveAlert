const { Telegraf } = require('telegraf')
const bot = new Telegraf('6368460619:AAHoCrptcVjvpCQ2iNnxrRdGa529qqWqWYk')
const geolocation = require('geolocation-utils');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/WaveAlert');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
//Esquema para las ubicaciones
const locationSchema = new mongoose.Schema({
    name: { type: String, required: false },
    chatId: { type: Number, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});

//Esquema para las alertas
const alertsSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, required: true }
})

//Modelo location
const Location = mongoose.model('Location', locationSchema);

//Modelo alerts
const Alerts = mongoose.model('Alerts', alertsSchema);

//Ultimo comando
let lastCommand = '';
// Almacena las ubicaciones en tiempo real por chat ID
const locations = {};
// Objeto para almacenar intervalos por chat ID
const intervals = {};
//----------------------------------- COMANDOS ----------------------------------------------
bot.start((ctx) => {
    ctx.reply('Bienvenido a WaveAlert')
})

bot.help((ctx) => {
    ctx.reply('Aqui se van a mostrar los comandos de WaveAlert')
})

// Función para enviar la solicitud de ubicación cada 5 segundos
function sendLocationRequest(chatId) {
    intervals[chatId] = setInterval(() => {
        const keyboard = {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: 'Compartir ubicación',
                            request_location: true, // Solicita la ubicación del usuario
                        },
                    ],
                ],
                one_time_keyboard: true,
            },
        };
        bot.telegram.sendMessage(chatId, 'Por favor, comparte tu ubicación:', keyboard);
    }, 5000);
}

// Comando que inicia el envío de solicitudes de ubicación
bot.command(['monitor'], (ctx) => {
    lastCommand = 'monitor';
    const chatId = ctx.message.chat.id;
    sendLocationRequest(chatId);
});

// Función para detener las solicitudes de ubicación
function stopLocationRequests(chatId) {
    clearInterval(intervals[chatId]);
    delete intervals[chatId];
}

// Comando para detener las solicitudes de ubicación
bot.command('stopmonitor', (ctx) => {
    const chatId = ctx.message.chat.id;
    stopLocationRequests(chatId);
    ctx.reply('Solicitudes de ubicación en tiempo real detenidas.');
});

// Alerta en caso de emergencia
bot.command('alert', (ctx) => {
    lastCommand = 'alert'
    ctx.reply('Solicitando ubicacion', {
        reply_markup: {
            keyboard: [
                [
                    {
                        text: 'Alerta: Envia tu ubicacion',
                        request_location: true,
                    },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    });
});

// Maneja la ubicación cuando el usuario la comparte
bot.on('location', async (ctx) => {
    if (lastCommand == 'monitor') {
        const chatId = ctx.message.chat.id;
        const location = ctx.message.location;
        const latitude = location.latitude;
        const longitude = location.longitude;
        const first = ctx.message.from.first_name;
        console.log(ctx.message)
        // Crea una nueva instancia de Location
        const newLocation = new Location({
            name: first,
            chatId: chatId,
            latitude: latitude,
            longitude: longitude,
        });

        try {
            await newLocation.save();
            ctx.reply('Ubicación guardada exitosamente en la base de datos.');
        } catch (error) {
            ctx.reply('Error al guardar la ubicación en la base de datos.');
            console.error(error);
        }
        ctx.reply(`Gracias por compartir tu ubicación. Latitud: ${latitude}, Longitud: ${longitude}`);
    }else if (lastCommand == 'alert')
    {
        const chatId = ctx.message.chat.id;
        const location = ctx.message.location;
        const latitude = location.latitude;
        const longitude = location.longitude;
        const first = ctx.message.from.first_name;

        const newAlert = new Alerts({
            name: first,
            status: 'No atendida',
            chatId: chatId,
            latitude: latitude,
            longitude: longitude,
        })

        try{
            await newAlert.save();
            ctx.reply('Envio de alerta guardado exitosamente en la base de datos.');
        }catch(error)
        {
            ctx.reply('Error al guardar el envio de alerta.');
            console.error(error);
        }
        
        ctx.reply(`${first} la alerta de emergencia ha sido enviada. Latitud: ${latitude}, Longitud: ${longitude}`);
    }
});

bot.launch()
