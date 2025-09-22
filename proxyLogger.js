import fs from "fs";
import path from "path";

const LOG_LEVELS = ["INFO", "ERROR"];

const logFileStream = fs.createWriteStream(path.resolve("./app.log"), {
  flags: "a",
  encoding: "utf8",
});

const getTimestamp = () => new Date().toISOString();

const safeStringifyArgs = (args) => {
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      if (typeof arg.send === "function" && typeof arg.on === "function") {
        return "[WebSocket]";
      }

      return { ...arg, password: "[password]" };
    }
    return arg;
  });
};

const writeLog = (level, message) => {
  if (!LOG_LEVELS.includes(level)) return;
  const logEntry = `[${level}] ${getTimestamp()} - ${message}`;
  logFileStream.write(logEntry + "\n");
};

const createLoggingProxy = (fn, options = {}) => {
  const { level = "INFO", logErrorsOnly = false } = options;

  if (!LOG_LEVELS.includes(level)) {
    throw new Error(`Невідомий рівень логування: ${level}`);
  }

  const handler = {
    apply(target, thisArg, argumentsList) {
      const start = Date.now();

      if (!logErrorsOnly) {
        const filteredArgs = safeStringifyArgs(argumentsList);
        writeLog(
          level,
          `Виклик ${target.name} з параметрами: ${JSON.stringify(filteredArgs)}`
        );
      }

      let result;
      try {
        result = Reflect.apply(target, thisArg, argumentsList);
      } catch (err) {
        writeLog("ERROR", `${target.name} викинув помилку: ${err.message}`);
        throw err;
      }

      if (result instanceof Promise) {
        return result
          .then((res) => {
            if (!logErrorsOnly) {
              const time = Date.now() - start;
              writeLog(level, `${target.name} повернув (Promise) за ${time}ms`);
            }
            return res;
          })
          .catch((err) => {
            writeLog("ERROR", `${target.name} викинув помилку: ${err.message}`);
            throw err;
          });
      } else {
        if (!logErrorsOnly) {
          const time = Date.now() - start;
          writeLog(level, `${target.name} повернув результат за ${time}ms`);
        }
        return result;
      }
    },
  };

  return new Proxy(fn, handler);
};

export default createLoggingProxy;
