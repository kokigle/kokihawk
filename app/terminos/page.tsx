import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function TerminosPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-5 md:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
                </Link>

                <div className="space-y-3 border-b border-border pb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Términos y Condiciones</h1>
                    <p className="text-muted-foreground">Última actualización: Mayo 2026</p>
                </div>

                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">
                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">1. Aceptación de los Términos</h3>
                        <p>Al acceder y utilizar el software KokiHawk (en adelante, "la Plataforma"), el usuario (en adelante, "el Cliente") acepta someterse a los presentes Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Plataforma.</p>
                    </div>

                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">2. Naturaleza del Servicio</h3>
                        <p>KokiHawk es una herramienta tecnológica B2B (Business to Business) diseñada para facilitar la actualización masiva de precios y la sincronización de catálogos mediante la integración con plataformas de terceros (ej. Mercado Libre, Tienda Nube). KokiHawk no es un marketplace, no interviene en las transacciones entre el Cliente y sus compradores, y no es representante legal ni comercial del Cliente.</p>
                    </div>

                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">3. Responsabilidad sobre los Precios Publicados</h3>
                        <p>La Plataforma provee herramientas de cálculo, mapeo de SKUs y previsualización de datos. <strong>El Cliente es el único y exclusivo responsable de auditar, verificar y confirmar la exactitud de los precios finales</strong> antes de ejecutar cualquier acción de sincronización hacia sus tiendas de comercio electrónico.</p>
                        <p>KokiHawk no se hace responsable civil, comercial ni penalmente por:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Errores de tipeo, cálculos erróneos o configuraciones incorrectas ingresadas por el Cliente.</li>
                            <li>Ventas concretadas a precios erróneos (demasiado bajos o altos) en Mercado Libre, Tienda Nube u otras plataformas.</li>
                            <li>Pérdidas financieras, lucro cesante o daños derivados de la publicación de precios incorrectos.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">4. Integraciones y Plataformas de Terceros</h3>
                        <p>KokiHawk utiliza las APIs provistas por Mercado Libre y Tienda Nube. KokiHawk no tiene control sobre la disponibilidad, latencia o cambios en las políticas de estas plataformas. El Cliente comprende que estas plataformas pueden aplicar límites de peticiones o suspender cuentas según sus propias normativas. KokiHawk no será responsable si la cuenta del Cliente es pausada o penalizada por dichas plataformas.</p>
                    </div>
                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">5. Privacidad y Protección de Datos</h3>
                        <p>KokiHawk se compromete a proteger la información confidencial del Cliente, incluyendo sus listas de proveedores y diccionarios de SKUs, en cumplimiento con la Ley de Protección de los Datos Personales N° 25.326 de la República Argentina. Los tokens de acceso a las plataformas de e-commerce se almacenan de forma segura y se utilizan única y exclusivamente para ejecutar las órdenes de actualización dictadas por el Cliente.</p>
                    </div>
                    <div>
                        <h3 className="text-foreground font-bold text-lg mb-2">6. Disponibilidad del Servicio</h3>
                        <p>KokiHawk realiza sus mayores esfuerzos para mantener la Plataforma operativa de forma ininterrumpida. Sin embargo, no garantiza que el servicio estará libre de errores o caídas temporales por mantenimiento de servidores, actualizaciones del sistema o causas de fuerza mayor.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}