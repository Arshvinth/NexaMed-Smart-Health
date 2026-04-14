import winston from "winston";
import path from "path";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp}[${level.toUpperCase()}]:${message}`;
});
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        logFormat
    ),
    transports: [

        //log all info in to console
        new winston.transports.Console(),
        //log errors in to seperate file
        new winston.transports.File({
            filename: path.join("logs", "error.log"),
            level: "error"
        }),
        //log all levels to cobinelog file
        new winston.transports.File({
            filename: path.join("logs", "combined.log")
        })
    ]
});

export default logger;