const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const productsRoutes = require("./routes/products");
const paymentRoutes = require("./routes/payment");
const adminRoutes = require("./routes/admin");
const ordersRoutes = require("./routes/orders");
const invoiceRoutes = require("./routes/invoice");
const webhooksRoutes = require("./routes/webhooks");
const bannersRoutes = require("./routes/banners");
const settingsRoutes = require("./routes/settings");
const analyticsRoutes = require("./routes/analytics");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.CLIENT_URL || "")
	.split(",")
	.map((item) => item.trim().replace(/\/$/, "")) // Normalize: remove trailing slashes
	.filter(Boolean);

app.use("/api/webhooks", webhooksRoutes);

app.use(helmet());
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			
			// Normalize incoming origin
			const originNormalized = origin.replace(/\/$/, "");

			// 1. Allow localhost for development
			if (originNormalized.startsWith("http://localhost:") || originNormalized.startsWith("http://127.0.0.1:")) {
				return callback(null, true);
			}

			// 2. Check against normalized allowedOrigins list
			if (allowedOrigins.includes(originNormalized)) {
				return callback(null, true);
			}

			// 3. Fallback for non-production environments
			if (!isProd && allowedOrigins.length === 0) return callback(null, true);
			
			return callback(null, false);
		}
	})
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/products", productsRoutes);
app.use("/api/pay", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/orders", ordersRoutes);
app.use("/api/orders", invoiceRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);

app.use(errorHandler);

module.exports = app;
