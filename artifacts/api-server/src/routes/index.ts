import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import sociedadesRouter from "./sociedades";
import marcasRouter from "./marcas";
import localesRouter from "./locales";
import localProductosRouter from "./local_productos";
import categoriasRouter from "./categorias";
import productosRouter from "./productos";
import stockRouter from "./stock";
import pedidosRouter from "./pedidos";
import facturasRouter from "./facturas";
import usuariosRouter from "./usuarios";
import configuracionRouter from "./configuracion";
import reportesRouter from "./reportes";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/sociedades", sociedadesRouter);
router.use("/marcas", marcasRouter);
router.use("/locales", localesRouter);
router.use("/locales", localProductosRouter);
router.use("/categorias", categoriasRouter);
router.use("/productos", productosRouter);
router.use("/stock", stockRouter);
router.use("/pedidos", pedidosRouter);
router.use("/facturas", facturasRouter);
router.use("/usuarios", usuariosRouter);
router.use("/configuracion", configuracionRouter);
router.use("/reportes", reportesRouter);

export default router;
