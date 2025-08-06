// src/VectorEstadoLaboratorio.js

export default class VectorEstadoLaboratorio {
     constructor() {
     this.evento = "inicialización";
     this.reloj = 0;

         this.rndLlegada = -1;
     this.tiempoEntreLlegadas = -1;
     this.proximaLlegada = 0;
     this.proximaLlegadaTipo = "";

         this.rndTipoTrabajo = -1;
     this.trabajo = "";
     this.rndFinTrabajo = -1;
     this.tiempoTrabajo = -1;

    this.finTrabajo1 = -1;
    this.finTrabajo2 = -1;
    this.retornoTrabajo1 = -1; // Para manejar interrupción del trabajo C
    this.retornoTrabajo2 = -1; // Para manejar interrupción del trabajo C

    this.tecnico1 = { estado: "libre", equipo: null };
    this.tecnico2 = { estado: "libre", equipo: null };

    this.colaEspera = [];
    this.rechazados = 0;

         this.equiposAtendidos = 0;
     this.totalTiempoPermanencia = 0;
     this.acumuladoPermanencia = 0;
     this.cantidadEquiposFinalizados = 0;

    this.usoTecnico1 = 0;
    this.usoTecnico2 = 0;
    
    // NUEVAS PROPIEDADES PARA INTERRUPCIÓN C
    this.equiposEnInterrupcion = []; // Equipos C que están en interrupción
    this.tiempoInicioInterrupcion1 = -1; // Cuándo empezó la interrupción del técnico 1
    this.tiempoInicioInterrupcion2 = -1; // Cuándo empezó la interrupción del técnico 2
    
    // NUEVAS PROPIEDADES PARA INTERRUPCIÓN TEMPORAL
    this.equiposInterrumpidosTemporalmente = []; // Equipos interrumpidos temporalmente por retorno de C
  }

     copiarDesde(v) {
     this.evento = v.evento || "";
     this.reloj = v.reloj;
     this.rndLlegada = v.rndLlegada;
     this.tiempoEntreLlegadas = v.tiempoEntreLlegadas;
     this.proximaLlegada = v.proximaLlegada;
     this.proximaLlegadaTipo = v.proximaLlegadaTipo;
     this.rndTipoTrabajo = v.rndTipoTrabajo;
     this.trabajo = v.trabajo;
     this.rndFinTrabajo = v.rndFinTrabajo;
     this.tiempoTrabajo = v.tiempoTrabajo;
     this.finTrabajo1 = v.finTrabajo1;
     this.finTrabajo2 = v.finTrabajo2;
     this.retornoTrabajo1 = v.retornoTrabajo1;
     this.retornoTrabajo2 = v.retornoTrabajo2;
     this.tecnico1 = { ...v.tecnico1 };
     this.tecnico2 = { ...v.tecnico2 };
     this.colaEspera = [...v.colaEspera];
     this.rechazados = v.rechazados;
     this.equiposAtendidos = v.equiposAtendidos;
     this.totalTiempoPermanencia = v.totalTiempoPermanencia;
     this.acumuladoPermanencia = v.acumuladoPermanencia;
     this.cantidadEquiposFinalizados = v.cantidadEquiposFinalizados;
     this.usoTecnico1 = v.usoTecnico1;
     this.usoTecnico2 = v.usoTecnico2;
     this.equiposEnInterrupcion = [...v.equiposEnInterrupcion];
     this.tiempoInicioInterrupcion1 = v.tiempoInicioInterrupcion1;
     this.tiempoInicioInterrupcion2 = v.tiempoInicioInterrupcion2;
     this.equiposInterrumpidosTemporalmente = [...v.equiposInterrumpidosTemporalmente];
     // ⚠️ NO copiar el array completo para evitar ocupar memoria innecesaria
     // ✅ Solo copiar las claves dinámicas que representan equipos activos
     Object.keys(v).forEach(key => {
       if (key.startsWith("estado_") || key.startsWith("llegada_")) {
         this[key] = v[key];
       }
     });
   }

     toRow() {
     const baseRow = {
       // EVENTO Y RELOJ
       evento: this.evento || "",
       reloj: this.reloj.toFixed(2),
      
                    // LLEGADAS (objetos temporales de llegada)
        rndLlegada: this.rndLlegada >= 0 ? this.rndLlegada.toFixed(2) : "",
        tiempoEntreLlegadas: this.tiempoEntreLlegadas >= 0 ? this.tiempoEntreLlegadas.toFixed(2) : "",
        proximaLlegada: this.proximaLlegada >= 0 ? this.proximaLlegada.toFixed(2) : "",
        proximaLlegadaTipo: this.proximaLlegadaTipo || "",
      
             // FIN DE TRABAJO (objetos temporales de fin de servicio)
       rndTipoTrabajo: this.rndTipoTrabajo >= 0 ? this.rndTipoTrabajo.toFixed(2) : "",
       trabajo: this.trabajo || "",
       rndFinTrabajo: this.rndFinTrabajo >= 0 ? this.rndFinTrabajo.toFixed(2) : "",
       tiempoTrabajo: this.tiempoTrabajo >= 0 ? this.tiempoTrabajo.toFixed(2) : "",
       finTrabajo1: this.finTrabajo1 >= 0 ? this.finTrabajo1.toFixed(2) : "",
       finTrabajo2: this.finTrabajo2 >= 0 ? this.finTrabajo2.toFixed(2) : "",
       retornoTrabajo1: this.retornoTrabajo1 >= 0 ? this.retornoTrabajo1.toFixed(2) : "",
       retornoTrabajo2: this.retornoTrabajo2 >= 0 ? this.retornoTrabajo2.toFixed(2) : "",
      
      // TÉCNICOS (estado del sistema)
      tecnico1: this.tecnico1.estado,
      tecnico2: this.tecnico2.estado,
      cola: this.colaEspera.length,
      
             // VARIABLES ESTADÍSTICAS (que resuelven el problema)
       acumuladoPermanencia: this.acumuladoPermanencia ? this.acumuladoPermanencia.toFixed(2) : "",
       cantidadEquiposFinalizados: this.cantidadEquiposFinalizados || 0,
       promedioPermanencia: this.promedioPermanencia ? this.promedioPermanencia.toFixed(2) : "",
       porcentajeRechazados: this.porcentajeRechazados ? this.porcentajeRechazados.toFixed(2) + "%" : "",
       porcentajeOcupacionTec1: this.porcentajeOcupacionTec1 ? this.porcentajeOcupacionTec1.toFixed(2) + "%" : "",
       porcentajeOcupacionTec2: this.porcentajeOcupacionTec2 ? this.porcentajeOcupacionTec2.toFixed(2) + "%" : "",
       porcentajeOcupacionAmbos: this.porcentajeOcupacionAmbos ? this.porcentajeOcupacionAmbos.toFixed(2) + "%" : "",
      
      // Información para renderizado dinámico
      equiposSimulados: this.equiposSimulados || [],
    };

    // Agregar columnas de equipos dinámicamente (estado y llegada separados)
    if (this.equiposSimulados && Array.isArray(this.equiposSimulados)) {
      this.equiposSimulados.forEach((equipo, index) => {
        const estadoKey = `estado_${index + 1}`;
        const llegadaKey = `llegada_${index + 1}`;
        baseRow[estadoKey] = this[estadoKey] || "";
        baseRow[llegadaKey] = this[llegadaKey] || "";
      });
    }

    return baseRow;
  }

  // MÉTODOS PARA MANEJAR INTERRUPCIÓN C
  iniciarInterrupcionC(equipo, tecnicoId, tiempoInicio) {
    const interrupcion = {
      equipo: equipo,
      tecnicoId: tecnicoId,
      tiempoInicio: tiempoInicio,
      tiempoFin: tiempoInicio + equipo.duracion,
      tiempoRetorno: tiempoInicio + equipo.duracion - 10
    };
    
    this.equiposEnInterrupcion.push(interrupcion);
    
    if (tecnicoId === 1) {
      this.tiempoInicioInterrupcion1 = tiempoInicio;
    } else {
      this.tiempoInicioInterrupcion2 = tiempoInicio;
    }
    
    return interrupcion;
  }

  obtenerInterrupcionPorTecnico(tecnicoId) {
    return this.equiposEnInterrupcion.find(i => i.tecnicoId === tecnicoId);
  }

  finalizarInterrupcionC(tecnicoId) {
    const index = this.equiposEnInterrupcion.findIndex(i => i.tecnicoId === tecnicoId);
    if (index !== -1) {
      this.equiposEnInterrupcion.splice(index, 1);
    }
    
    if (tecnicoId === 1) {
      this.tiempoInicioInterrupcion1 = -1;
    } else {
      this.tiempoInicioInterrupcion2 = -1;
    }
  }

  // MÉTODOS PARA MANEJAR INTERRUPCIÓN TEMPORAL
  guardarInterrupcionTemporal(equipo, tecnicoId, tiempoInterrupcion) {
    // Calcular cuánto tiempo ya trabajó en el equipo
    const tiempoYaTrabajado = tiempoInterrupcion - equipo.llegada;
    const tiempoRestante = equipo.duracion - tiempoYaTrabajado;
    
    const interrupcionTemp = {
      equipo: equipo,
      tecnicoId: tecnicoId,
      tiempoInterrupcion: tiempoInterrupcion,
      tiempoRestante: tiempoRestante > 0 ? tiempoRestante : 0.1 // Mínimo 0.1 minuto
    };
    
    this.equiposInterrumpidosTemporalmente.push(interrupcionTemp);
    return interrupcionTemp;
  }

  obtenerInterrupcionTemporal(tecnicoId) {
    return this.equiposInterrumpidosTemporalmente.find(i => i.tecnicoId === tecnicoId);
  }

  limpiarInterrupcionTemporal(tecnicoId) {
    const index = this.equiposInterrumpidosTemporalmente.findIndex(i => i.tecnicoId === tecnicoId);
    if (index !== -1) {
      this.equiposInterrumpidosTemporalmente.splice(index, 1);
    }
  }

  static trabajos = {
    A: { nombre: "Cambio de placa", prob: 0.3, media: 150 },
    B: { nombre: "Ampliación de memoria", prob: 0.3, media: 60 },
    C: { nombre: "Formateo de disco", prob: 0.15, media: 180 },
    D: { nombre: "Agregar CD o DVD", prob: 0.1, media: 60 },
    E: { nombre: "Cambio de memoria", prob: 0.15, media: 30 },
  };

  static seleccionarTrabajo(rnd) {
    let acumulado = 0;
    for (const [clave, val] of Object.entries(this.trabajos)) {
      acumulado += val.prob;
      if (rnd <= acumulado) return clave;
    }
    return "E"; // fallback
  }

  static tiempoUniforme(min, max) {
    return min + Math.random() * (max - min);
  }

  static tiempoTrabajo(trabajo) {
    const media = this.trabajos[trabajo].media;
    return this.tiempoUniforme(media - 5, media + 5);
  }

  static tiempoLlegada() {
    return this.tiempoUniforme(30, 90);
  }
}
