// /**
//  * Built-in Log Configuration
//  * (sails.config.log)
//  *
//  * Configure the log level for your app, as well as the transport
//  * (Underneath the covers, Sails uses Winston for logging, which
//  * allows for some pretty neat custom transports/adapters for log messages)
//  *
//  * For more information on the Sails logger, check out:
//  * https://sailsjs.com/docs/concepts/logging
//  */

// module.exports.log = {
//   noship: true,
//   /***************************************************************************
//   *                                                                          *
//   * Valid `level` configs: i.e. the minimum log level to capture with        *
//   * sails.log.*()                                                            *
//   *                                                                          *
//   * The order of precedence for log levels from lowest to highest is:        *
//   * silly, verbose, info, debug, warn, error                                 *
//   *                                                                          *
//   * You may also set the level to "silent" to suppress all logs.             *
//   *                                                                          *
//   ***************************************************************************/

//    //level: 'silent'

// };

const { version } = require('../package');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, label, printf, align } = format;
const { SPLAT } = require('triple-beam');
const { isObject } = require('lodash');

function formatObject(param) {
  if (isObject(param)) {
    return JSON.stringify(param);
  }
  return param;
}

// Ignore log messages if they have { private: true }
const all = format((info) => {
  const splat = info[SPLAT] || [];
  const message = formatObject(info.message);
  const rest = splat.map(formatObject).join(' ');
  info.message = `${message} ${rest}`;
  return info;
});

const customLogger = createLogger({
  format: combine(
    all(),
    label({ label: version }),
    timestamp(),
    colorize(),
    align(),
    printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${formatObject(info.message)}`)
  ),
  transports: [new transports.Console()]
});

module.exports.log = {
  custom: customLogger,
  inspect: false,
  level: 'info'
};
