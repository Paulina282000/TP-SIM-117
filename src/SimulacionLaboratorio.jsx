// src/SimulacionLaboratorio.jsx
import React, { useState } from "react";
import VectorEstadoLaboratorio from "./VectorEstadoLaboratorio";

const SimulacionLaboratorio = () => {
  const [filas, setFilas] = useState([]);
  const [desde, setDesde] = useState(0);
  const [hasta, setHasta] = useState(100);
  const [cantidadSimulaciones, setCantidadSimulaciones] = useState(300);

  const simular = () => {
    try {
      console.log("Iniciando simulación...");
      
      // Validaciones
      if (cantidadSimulaciones <= 0) {
        alert("La cantidad de simulaciones debe ser mayor a 0");
        return;
      }
    if (desde < 0 || hasta < 0) {
      alert("Los valores 'desde' y 'hasta' deben ser mayores o iguales a 0");
      return;
    }
    if (desde >= cantidadSimulaciones) {
      alert("El valor 'desde' debe ser menor que la cantidad de simulaciones");
      return;
    }
    if (hasta <= desde) {
      alert("El valor 'hasta' debe ser mayor que 'desde'");
      return;
    }
    if (hasta > cantidadSimulaciones) {
      alert("El valor 'hasta' no puede ser mayor que la cantidad de simulaciones");
      return;
    }

    const filasSimulacion = [];
    const equiposSimulados = [];
    let reloj = 0;
    const rndInicial = Math.random();
    const tiempoInicial = generarTiempoEntreLlegadas();
    let proximaLlegada = tiempoInicial;
    
    // Para verificar que los RNDs sean únicos
    const rndsGenerados = new Set();
    rndsGenerados.add(rndInicial);
    
    console.log("Parámetros:", { cantidadSimulaciones, desde, hasta, proximaLlegada });
    console.log("RND inicial:", rndInicial.toFixed(4), "Tiempo inicial:", tiempoInicial.toFixed(2));

    // Estado inicial
    let fila = new VectorEstadoLaboratorio();
    fila.evento = "inicialización";
    fila.reloj = reloj;
    fila.rndLlegada = rndInicial;
    fila.tiempoEntreLlegadas = tiempoInicial;
    fila.proximaLlegada = proximaLlegada;
    fila.tecnico1 = { estado: "libre", equipo: null };
    fila.tecnico2 = { estado: "libre", equipo: null };
    fila.colaEspera = [];
    fila.equiposRechazados = 0;
    fila.equiposAtendidos = 0;
    fila.tiempoTotalPermanencia = 0;
    fila.usoTecnico1 = 0;
    fila.usoTecnico2 = 0;
    fila.tiempoInicioOcupacionTec1 = -1;
    fila.tiempoInicioOcupacionTec2 = -1;
    
    // Asegurar que la cola esté inicializada
    if (!fila.colaEspera) {
      fila.colaEspera = [];
    }

    filasSimulacion.push(fila.toRow());

    let iteraciones = 0;
    const maxIteraciones = cantidadSimulaciones * 20; // Límite de seguridad más alto
    
    while (equiposSimulados.length < cantidadSimulaciones && iteraciones < maxIteraciones) {
      iteraciones++;
      
      if (iteraciones % 50 === 0) {
        console.log(`Iteración ${iteraciones}, equipos simulados: ${equiposSimulados.length}, reloj: ${reloj.toFixed(2)}`);
      }
      
      const anterior = fila;
      fila = new VectorEstadoLaboratorio();
      fila.copiarDesde(anterior);

      // Determinar próximo evento
      const eventos = [
        anterior.proximaLlegada,
        anterior.finTrabajo1,
        anterior.finTrabajo2,
        anterior.retornoTrabajo1,
        anterior.retornoTrabajo2
      ].filter(e => e >= 0);

      if (eventos.length === 0) {
        console.log("No hay eventos activos, terminando simulación");
        break;
      }

      const proximo = Math.min(...eventos);
      reloj = proximo;
      fila.reloj = reloj;

      console.log(`Evento: ${proximo}, Reloj: ${reloj.toFixed(2)}, Equipos: ${equiposSimulados.length}`);

      // Procesar evento
      if (proximo === anterior.proximaLlegada) {
        fila.evento = `llegada_equipo_${equiposSimulados.length + 1}`;
        // Llegada de equipo
        const rndLlegada = Math.random();
        const tiempoEntreLlegadas = generarTiempoEntreLlegadas();
        proximaLlegada = reloj + tiempoEntreLlegadas;

        const rndTipoTrabajo = Math.random();
        const trabajo = determinarTipoTrabajo(rndTipoTrabajo);
        const tiempoTrabajo = generarTiempoTrabajo(trabajo);
        
        // Asignar valores a la fila
        // Verificar que los RNDs sean únicos
        if (rndsGenerados.has(rndLlegada)) {
          console.warn(`RND duplicado detectado: ${rndLlegada.toFixed(4)}`);
        }
        if (rndsGenerados.has(rndTipoTrabajo)) {
          console.warn(`RND duplicado detectado: ${rndTipoTrabajo.toFixed(4)}`);
        }
        rndsGenerados.add(rndLlegada);
        rndsGenerados.add(rndTipoTrabajo);

        const equipo = {
          id: equiposSimulados.length + 1,
          llegada: reloj,
          tipo: trabajo,
          duracion: tiempoTrabajo,
          estado: "ER" // Esperando Reparación
        };

        fila.rndLlegada = rndLlegada;
        fila.tiempoEntreLlegadas = tiempoEntreLlegadas;
        fila.proximaLlegada = proximaLlegada;
        fila.rndTipoTrabajo = rndTipoTrabajo;
        fila.trabajo = trabajo;
        fila.tiempoTrabajo = tiempoTrabajo;

        equiposSimulados.push(equipo);
        console.log(`Equipo ${equipo.id} creado: ${equipo.tipo}, duración: ${equipo.duracion}`);
        console.log(`RNDs: llegada=${rndLlegada.toFixed(4)}, tipo=${rndTipoTrabajo.toFixed(4)}`);

        // Asignar a técnico o cola
        const tecnico1Libre = fila.tecnico1.estado === "libre";
        const tecnico2Libre = fila.tecnico2.estado === "libre";

        if (tecnico1Libre) {
          fila.tecnico1.estado = "ocupado";
          fila.tecnico1.equipo = equipo;
          equipo.estado = "SR";
          equipo.tecnico = 1;
          fila.tiempoInicioOcupacionTec1 = reloj;
          fila[`estado_${equipo.id}`] = "SR";
          fila[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);

          // Generar RND para fin de trabajo
          const rndFinTrabajo = Math.random();
          fila.rndFinTrabajo = rndFinTrabajo;

          if (trabajo === "C") {
            // Interrupción: técnico sale a los 25 min, regresa 10 min antes del fin
            fila.finTrabajo1 = reloj + 25;
            fila.retornoTrabajo1 = reloj + tiempoTrabajo - 10;
            // Registrar la interrupción
            fila.iniciarInterrupcionC(equipo, 1, reloj);
          } else {
            fila.finTrabajo1 = reloj + tiempoTrabajo;
          }
        } else if (tecnico2Libre) {
          fila.tecnico2.estado = "ocupado";
          fila.tecnico2.equipo = equipo;
          equipo.estado = "SR";
          equipo.tecnico = 2;
          fila.tiempoInicioOcupacionTec2 = reloj;
          fila[`estado_${equipo.id}`] = "SR";
          fila[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);

          // Generar RND para fin de trabajo
          const rndFinTrabajo = Math.random();
          fila.rndFinTrabajo = rndFinTrabajo;

          if (trabajo === "C") {
            fila.finTrabajo2 = reloj + 25;
            fila.retornoTrabajo2 = reloj + tiempoTrabajo - 10;
            // Registrar la interrupción
            fila.iniciarInterrupcionC(equipo, 2, reloj);
          } else {
            fila.finTrabajo2 = reloj + tiempoTrabajo;
          }
        } else {
          // Ambos técnicos ocupados
          if (fila.colaEspera && fila.colaEspera.length < 3) {
            fila.colaEspera.push(equipo);
            fila[`estado_${equipo.id}`] = "ER";
            fila[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);
          } else {
            equipo.estado = "R"; // Rechazado
            fila[`estado_${equipo.id}`] = "R";
            fila[`llegada_${equipo.id}`] = equipo.llegada.toFixed(2);
            fila.equiposRechazados++;
          }
        }

      } else if (proximo === anterior.finTrabajo1) {
        fila.evento = "fin_trabajo_tec1";
        // Limpiar valores de llegada ya que no es una llegada
        fila.rndLlegada = -1;
        fila.tiempoEntreLlegadas = -1;
        fila.rndTipoTrabajo = -1;
        fila.trabajo = "";
        fila.rndFinTrabajo = -1;
        fila.tiempoTrabajo = -1;
        
        // Fin trabajo técnico 1
        const equipoFinalizado = anterior.tecnico1.equipo;
        
        if (equipoFinalizado) {
          if (equipoFinalizado.tipo === "C" && anterior.retornoTrabajo1 > 0) {
            // Interrupción: técnico sale, equipo queda en proceso
            fila.tecnico1.estado = "libre";
            fila.tecnico1.equipo = null;
            fila.finTrabajo1 = -1;
            // El equipo sigue en interrupción hasta el retorno
            equipoFinalizado.estado = "INT"; // Interrumpido
            fila[`estado_${equipoFinalizado.id}`] = "INT";
          } else {
            // Trabajo normal terminado
            fila.tecnico1.estado = "libre";
            fila.tecnico1.equipo = null;
            fila.finTrabajo1 = -1;
            equipoFinalizado.estado = "T";
            fila[`estado_${equipoFinalizado.id}`] = "T";
            fila.equiposAtendidos++;
            
            // Si era un trabajo C, finalizar la interrupción
            if (equipoFinalizado.tipo === "C") {
              fila.finalizarInterrupcionC(1);
            }
          }
        }

        // Asignar siguiente equipo de la cola
        if (fila.tecnico1.estado === "libre" && fila.colaEspera.length > 0) {
          const siguienteEquipo = fila.colaEspera.shift();
          if (siguienteEquipo) {
            fila.tecnico1.estado = "ocupado";
            fila.tecnico1.equipo = siguienteEquipo;
            siguienteEquipo.estado = "SR";
            siguienteEquipo.tecnico = 1;
            fila[`estado_${siguienteEquipo.id}`] = "SR";

            // Generar RND para fin de trabajo
            const rndFinTrabajo = Math.random();
            fila.rndFinTrabajo = rndFinTrabajo;
            fila.tiempoTrabajo = siguienteEquipo.duracion;

            if (siguienteEquipo.tipo === "C") {
              fila.finTrabajo1 = reloj + 25;
              fila.retornoTrabajo1 = reloj + siguienteEquipo.duracion - 10;
            } else {
              fila.finTrabajo1 = reloj + siguienteEquipo.duracion;
            }
          }
        }

      } else if (proximo === anterior.finTrabajo2) {
        fila.evento = "fin_trabajo_tec2";
        // Limpiar valores de llegada ya que no es una llegada
        fila.rndLlegada = -1;
        fila.tiempoEntreLlegadas = -1;
        fila.rndTipoTrabajo = -1;
        fila.trabajo = "";
        fila.rndFinTrabajo = -1;
        fila.tiempoTrabajo = -1;
        
        // Fin trabajo técnico 2
        const equipoFinalizado = anterior.tecnico2.equipo;
        
        if (equipoFinalizado) {
          if (equipoFinalizado.tipo === "C" && anterior.retornoTrabajo2 > 0) {
            fila.tecnico2.estado = "libre";
            fila.tecnico2.equipo = null;
            fila.finTrabajo2 = -1;
            // El equipo sigue en interrupción hasta el retorno
            equipoFinalizado.estado = "INT"; // Interrumpido
            fila[`estado_${equipoFinalizado.id}`] = "INT";
          } else {
            fila.tecnico2.estado = "libre";
            fila.tecnico2.equipo = null;
            fila.finTrabajo2 = -1;
            equipoFinalizado.estado = "T";
            fila[`estado_${equipoFinalizado.id}`] = "T";
            fila.equiposAtendidos++;
            
            // Si era un trabajo C, finalizar la interrupción
            if (equipoFinalizado.tipo === "C") {
              fila.finalizarInterrupcionC(2);
            }
          }
        }

        if (fila.tecnico2.estado === "libre" && fila.colaEspera.length > 0) {
          const siguienteEquipo = fila.colaEspera.shift();
          if (siguienteEquipo) {
            fila.tecnico2.estado = "ocupado";
            fila.tecnico2.equipo = siguienteEquipo;
            siguienteEquipo.estado = "SR";
            siguienteEquipo.tecnico = 2;
            fila[`estado_${siguienteEquipo.id}`] = "SR";

            // Generar RND para fin de trabajo
            const rndFinTrabajo = Math.random();
            fila.rndFinTrabajo = rndFinTrabajo;
            fila.tiempoTrabajo = siguienteEquipo.duracion;

            if (siguienteEquipo.tipo === "C") {
              fila.finTrabajo2 = reloj + 25;
              fila.retornoTrabajo2 = reloj + siguienteEquipo.duracion - 10;
            } else {
              fila.finTrabajo2 = reloj + siguienteEquipo.duracion;
            }
          }
        }

      } else if (proximo === anterior.retornoTrabajo1) {
        fila.evento = "retorno_tec1";
        // Limpiar valores de llegada ya que no es una llegada
        fila.rndLlegada = -1;
        fila.tiempoEntreLlegadas = -1;
        fila.rndTipoTrabajo = -1;
        fila.trabajo = "";
        fila.rndFinTrabajo = -1;
        fila.tiempoTrabajo = -1;
        
        // Retorno técnico 1 después de interrupción
        fila.retornoTrabajo1 = -1;
        fila.finTrabajo1 = reloj + 10; // Termina en 10 minutos
        
        // Buscar el equipo en interrupción y asignarlo al técnico
        const interrupcion = fila.obtenerInterrupcionPorTecnico(1);
        if (interrupcion) {
          fila.tecnico1.estado = "ocupado";
          fila.tecnico1.equipo = interrupcion.equipo;
          interrupcion.equipo.estado = "SR";
          interrupcion.equipo.tecnico = 1;
        }

      } else if (proximo === anterior.retornoTrabajo2) {
        fila.evento = "retorno_tec2";
        // Limpiar valores de llegada ya que no es una llegada
        fila.rndLlegada = -1;
        fila.tiempoEntreLlegadas = -1;
        fila.rndTipoTrabajo = -1;
        fila.trabajo = "";
        fila.rndFinTrabajo = -1;
        fila.tiempoTrabajo = -1;
        
        // Retorno técnico 2 después de interrupción
        fila.retornoTrabajo2 = -1;
        fila.finTrabajo2 = reloj + 10; // Termina en 10 minutos
        
        // Buscar el equipo en interrupción y asignarlo al técnico
        const interrupcion = fila.obtenerInterrupcionPorTecnico(2);
        if (interrupcion) {
          fila.tecnico2.estado = "ocupado";
          fila.tecnico2.equipo = interrupcion.equipo;
          interrupcion.equipo.estado = "SR";
          interrupcion.equipo.tecnico = 2;
        }
      }

      // Guardar referencia a equipos simulados en el vector de estado
      fila.equiposSimulados = equiposSimulados;

      // Actualizar equipos en la fila dinámicamente
      equiposSimulados.forEach((eq, index) => {
        if (eq && eq.llegada !== undefined) {
          // Estado del equipo
          fila[`estado_${index + 1}`] = eq.estado;
          
          // Hora de llegada del equipo
          fila[`llegada_${index + 1}`] = eq.llegada.toFixed(2);
        } else {
          fila[`estado_${index + 1}`] = "";
          fila[`llegada_${index + 1}`] = "";
        }
      });

      // Calcular variables estadísticas
      
      // Calcular ocupación de técnicos de manera más precisa
      const tiempoTotal = reloj;
      
      // Técnico 1: ocupado si está trabajando o si tiene un equipo asignado
      const tecnico1Ocupado = fila.tecnico1.estado === "ocupado" || fila.tecnico1.equipo !== null;
      if (tecnico1Ocupado && fila.tiempoInicioOcupacionTec1 === -1) {
        fila.tiempoInicioOcupacionTec1 = reloj;
      }
      
      // Técnico 2: ocupado si está trabajando o si tiene un equipo asignado
      const tecnico2Ocupado = fila.tecnico2.estado === "ocupado" || fila.tecnico2.equipo !== null;
      if (tecnico2Ocupado && fila.tiempoInicioOcupacionTec2 === -1) {
        fila.tiempoInicioOcupacionTec2 = reloj;
      }
      
      // Acumular tiempo de ocupación
      if (tecnico1Ocupado) {
        fila.usoTecnico1 = (fila.tiempoInicioOcupacionTec1 >= 0) ? 
          (reloj - fila.tiempoInicioOcupacionTec1) : 0;
      }
      
      if (tecnico2Ocupado) {
        fila.usoTecnico2 = (fila.tiempoInicioOcupacionTec2 >= 0) ? 
          (reloj - fila.tiempoInicioOcupacionTec2) : 0;
      }
      
      // Calcular porcentajes de ocupación (siempre)
      fila.porcentajeOcupacionTec1 = tiempoTotal > 0 ? (fila.usoTecnico1 / tiempoTotal) * 100 : 0;
      fila.porcentajeOcupacionTec2 = tiempoTotal > 0 ? (fila.usoTecnico2 / tiempoTotal) * 100 : 0;
      
      // Calcular porcentaje de ocupación de ambos técnicos (siempre)
      const tiempoOcupadoAmbos = fila.usoTecnico1 + fila.usoTecnico2;
      fila.porcentajeOcupacionAmbos = tiempoTotal > 0 ? (tiempoOcupadoAmbos / tiempoTotal) * 100 : 0;
      
      // Calcular otras estadísticas
      const equiposTerminados = equiposSimulados.filter(eq => eq.estado === "T");
      const equiposRechazados = equiposSimulados.filter(eq => eq.estado === "R");
      
      // Acumulado de permanencia
      if (equiposTerminados.length > 0) {
        const tiempoTotalPermanencia = equiposTerminados
          .reduce((total, eq) => total + (reloj - eq.llegada), 0);
        fila.acumuladoPermanencia = tiempoTotalPermanencia;
        fila.promedioPermanencia = tiempoTotalPermanencia / equiposTerminados.length;
      } else {
        fila.acumuladoPermanencia = 0;
        fila.promedioPermanencia = 0;
      }
      
      // Cantidad de equipos finalizados
      fila.cantidadEquiposFinalizados = equiposTerminados.length;
      
      // Porcentaje de equipos rechazados
      fila.porcentajeRechazados = equiposSimulados.length > 0 ? 
        (equiposRechazados.length / equiposSimulados.length) * 100 : 0;



      filasSimulacion.push(fila.toRow());
    }
    
    console.log(`Simulación completada. Iteraciones: ${iteraciones}, Equipos: ${equiposSimulados.length}`);
    
    if (iteraciones >= maxIteraciones) {
      console.warn("¡ADVERTENCIA! Se alcanzó el límite máximo de iteraciones");
    }

    // Mostrar solo el rango solicitado
    const filasMostrar = filasSimulacion.slice(desde, hasta + 1);
    console.log("Filas a mostrar:", filasMostrar.length);
    setFilas(filasMostrar);

    // Calcular métricas finales
    const equiposAtendidos = equiposSimulados.filter(eq => eq.estado === "T").length;
    const tiempoTotalPermanencia = equiposSimulados
      .filter(eq => eq.estado === "T")
      .reduce((total, eq) => total + (reloj - eq.llegada), 0);
    const promedioPermanencia = equiposAtendidos > 0 ? tiempoTotalPermanencia / equiposAtendidos : 0;
    const porcentajeRechazados = (fila.equiposRechazados / equiposSimulados.length) * 100;
    const porcentajeOcupacionTec1 = reloj > 0 ? (fila.usoTecnico1 / reloj) * 100 : 0;
    const porcentajeOcupacionTec2 = reloj > 0 ? (fila.usoTecnico2 / reloj) * 100 : 0;
    const porcentajeOcupacionAmbos = reloj > 0 ? ((fila.usoTecnico1 + fila.usoTecnico2) / reloj) * 100 : 0;

    console.log("=== RESULTADOS DE LA SIMULACIÓN ===");
    console.log("a) Promedio de permanencia en el laboratorio:", promedioPermanencia.toFixed(2), "minutos");
    console.log("b) Porcentaje de equipos rechazados:", porcentajeRechazados.toFixed(2) + "%");
    console.log("c) Porcentaje de ocupación técnico 1:", porcentajeOcupacionTec1.toFixed(2) + "%");
    console.log("   Porcentaje de ocupación técnico 2:", porcentajeOcupacionTec2.toFixed(2) + "%");
    console.log("   Porcentaje de ocupación ambos técnicos:", porcentajeOcupacionAmbos.toFixed(2) + "%");
    console.log("=====================================");
    } catch (error) {
      console.error("Error en la simulación:", error);
      alert("Error en la simulación: " + error.message);
    }
  };

  const generarTiempoEntreLlegadas = () => {
    // Distribución uniforme entre 30 y 90 minutos según el problema
    return 30 + Math.random() * (90 - 30);
  };

  const determinarTipoTrabajo = (rnd) => {
    // Probabilidades exactas según el problema
    if (rnd < 0.3) return "A";    // 30%
    if (rnd < 0.6) return "B";    // 30%
    if (rnd < 0.75) return "C";   // 15%
    if (rnd < 0.85) return "D";   // 10%
    return "E";                   // 15%
  };

  const generarTiempoTrabajo = (tipo) => {
    // Distribución uniforme con ±5 minutos de la media según el problema
    const medias = {
      "A": 150, // 2h 30m = 150 min
      "B": 60,  // 1h = 60 min
      "C": 180, // 3h = 180 min
      "D": 60,  // 1h = 60 min
      "E": 30   // 30 min
    };
    const media = medias[tipo] || 60;
    return media - 5 + Math.random() * 10; // Uniforme entre media-5 y media+5
  };

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Simulación de Laboratorio de Reparación</h1>
          <p className="mb-4">Sistema de gestión de equipos informáticos</p>
          <div className="bg-white border p-4 inline-block">
            <p className="text-sm">
              <strong>Cátedra:</strong> Simulación<br/>
              <strong>Nombre:</strong> Paulina Tirante
            </p>
          </div>
        </div>

        {/* Tipos de trabajo */}
        <div className="bg-white border p-4">
          <h3 className="font-bold mb-2">Tipos de Trabajo:</h3>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-blue-500 text-white flex items-center justify-center text-xs font-bold">A</span>
              <span>Cambio de placa</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-green-500 text-white flex items-center justify-center text-xs font-bold">B</span>
              <span>Ampliación de memoria</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">C</span>
              <span>Formateo de disco</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-purple-500 text-white flex items-center justify-center text-xs font-bold">D</span>
              <span>Agregar CD/DVD</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 bg-red-500 text-white flex items-center justify-center text-xs font-bold">E</span>
              <span>Cambio de memoria</span>
            </div>
          </div>
        </div>

        {/* Controles de simulación */}
        <div className="bg-white border p-4">
          <h3 className="font-bold mb-4">Parámetros de Simulación</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Cantidad de simulaciones</label>
              <input 
                type="number" 
                value={cantidadSimulaciones} 
                onChange={e => setCantidadSimulaciones(Math.max(1, +e.target.value))}
                min="1"
                className="w-full border px-2 py-1" 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Mostrar desde</label>
              <input 
                type="number" 
                value={desde} 
                onChange={e => setDesde(Math.max(0, +e.target.value))}
                min="0"
                className="w-full border px-2 py-1" 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Hasta</label>
              <input 
                type="number" 
                value={hasta} 
                onChange={e => setHasta(Math.max(desde + 1, +e.target.value))}
                min={desde + 1}
                className="w-full border px-2 py-1" 
              />
            </div>
            <div className="flex items-end">
              <button onClick={simular} className="w-full bg-blue-600 text-white py-2 px-4">Simular</button>
            </div>
          </div>
      </div>

        {/* Resultados */}
      {filas.length > 0 && (
          <div className="overflow-x-auto mt-4 border">
            <table className="w-full border-collapse">
                            <thead>
                {/* Primera fila de encabezados agrupados */}
                <tr className="bg-gray-200">
                  <th rowSpan="2" className="border px-2 py-1 text-center bg-blue-100">Reloj</th>
                  
                  {/* LLEGADAS */}
                  <th colSpan="3" className="border px-2 py-1 text-center bg-blue-200">Llegadas</th>
                  
                  {/* FIN DE TRABAJO */}
                  <th colSpan="4" className="border px-2 py-1 text-center bg-orange-200">Fin de Trabajo</th>
                  
                  {/* TÉCNICOS */}
                  <th colSpan="4" className="border px-2 py-1 text-center bg-gray-200">Técnicos</th>
                  
                  {/* COLUMNAS INDIVIDUALES */}
                  <th rowSpan="2" className="border px-2 py-1 text-center bg-green-200">Cola</th>
                  <th rowSpan="2" className="border px-2 py-1 text-center bg-green-200">Acumulado permanencia</th>
                  
                  {/* VARIABLES ESTADÍSTICAS */}
                  <th colSpan="6" className="border px-2 py-1 text-center bg-green-200">Variables Estadísticas</th>
                  
                  {/* EQUIPOS - Encabezados individuales */}
                  {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                    <th key={i} colSpan="1" className="border px-2 py-1 text-center bg-purple-200">
                      EQUIPO {i + 1}
                    </th>
                  ))}
                </tr>
                
                {/* Segunda fila de encabezados específicos */}
                <tr className="bg-gray-200">
                  {/* LLEGADAS */}
                  <th className="border px-2 py-1 text-center bg-blue-200">RND</th>
                  <th className="border px-2 py-1 text-center bg-blue-200">Tiempo entre llegadas</th>
                  <th className="border px-2 py-1 text-center bg-blue-200">Próxima llegada Tipo</th>
                  
                  {/* FIN DE TRABAJO */}
                  <th className="border px-2 py-1 text-center bg-orange-200">RND</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Tiempo trabajo</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Fin trabajo 1</th>
                  <th className="border px-2 py-1 text-center bg-orange-200">Fin trabajo 2</th>
                  
                  {/* TÉCNICOS */}
                  <th className="border px-2 py-1 text-center bg-gray-200">Retorno 1</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Retorno 2</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Técnico 1</th>
                  <th className="border px-2 py-1 text-center bg-gray-200">Técnico 2</th>
                  
                  {/* VARIABLES ESTADÍSTICAS */}
                  <th className="border px-2 py-1 text-center bg-green-200">Cantidad equipos finalizados</th>
                  <th className="border px-2 py-1 text-center bg-green-200">Promedio permanencia</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Rechazados</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Tec1</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Tec2</th>
                  <th className="border px-2 py-1 text-center bg-green-200">% Ocupación Ambos</th>
                  
                  {/* EQUIPOS - Sub-columnas */}
                  {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                    <React.Fragment key={i}>
                      <th className="border px-2 py-1 text-center bg-purple-200 min-w-[100px]">
                        estado
                      </th>
                      <th className="border px-2 py-1 text-center bg-purple-200 min-w-[80px]">
                        Hora Ingre
                      </th>
                    </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                    {/* RELOJ */}
                    <td className="border px-2 py-1 text-center">{fila.reloj}</td>
                    
                    {/* LLEGADAS */}
                    <td className="border px-2 py-1 text-center">{fila.rndLlegada}</td>
                    <td className="border px-2 py-1 text-center">{fila.tiempoEntreLlegadas}</td>
                    <td className="border px-2 py-1 text-center">{fila.trabajo}</td>
                    
                    {/* FIN DE TRABAJO */}
                    <td className="border px-2 py-1 text-center">{fila.rndFinTrabajo || ""}</td>
                    <td className="border px-2 py-1 text-center">{fila.tiempoTrabajo}</td>
                    <td className="border px-2 py-1 text-center">{fila.finTrabajo1}</td>
                    <td className="border px-2 py-1 text-center">{fila.finTrabajo2}</td>
                    
                    {/* TÉCNICOS */}
                    <td className="border px-2 py-1 text-center">{fila.retornoTrabajo1}</td>
                    <td className="border px-2 py-1 text-center">{fila.retornoTrabajo2}</td>
                    <td className="border px-2 py-1 text-center">{fila.tecnico1}</td>
                    <td className="border px-2 py-1 text-center">{fila.tecnico2}</td>
                    
                    {/* COLUMNAS INDIVIDUALES */}
                    <td className="border px-2 py-1 text-center">{fila.cola}</td>
                    <td className="border px-2 py-1 text-center">{fila.acumuladoPermanencia}</td>
                    
                    {/* VARIABLES ESTADÍSTICAS */}
                    <td className="border px-2 py-1 text-center">{fila.cantidadEquiposFinalizados}</td>
                    <td className="border px-2 py-1 text-center">{fila.promedioPermanencia}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeRechazados}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionTec1}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionTec2}</td>
                    <td className="border px-2 py-1 text-center">{fila.porcentajeOcupacionAmbos}</td>
                    
                    {/* EQUIPOS */}
                    {Array.from({length: filas.length > 0 ? filas[0].equiposSimulados?.length || 10 : 10}, (_, i) => (
                      <td key={i} className="border px-2 py-1 text-center">
                        {fila[`estado_${i + 1}`] || ""}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};

export default SimulacionLaboratorio;
