const fs = require("fs");
const path = require("path");

module.exports = {
  lintOnSave: false,

  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get("/config.json", (req, res) => {
        const configLocalPath = path.join(
          __dirname,
          "public/config.json.local"
        );
        const configPath = path.join(__dirname, "public/config.json");

        const targetPath = fs.existsSync(configLocalPath)
          ? configLocalPath
          : configPath;
        try {
          const config = fs.readFileSync(targetPath, "utf8");
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-cache");
          res.send(config);
        } catch (error) {
          console.error("Failed to read config file:", error);
          res.status(500).json({ error: "Failed to load configuration" });
        }
      });

      return middlewares;
    },
  },
};
