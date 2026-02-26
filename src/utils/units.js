export const UNITS = {
    m: { label: 'm', factor: 0.001, precision: 2 },
    cm: { label: 'cm', factor: 0.1, precision: 1 },
    mm: { label: 'mm', factor: 1, precision: 0 },
    ft: { label: 'ft', factor: 0.00328084, precision: 2 },
    in: { label: 'in', factor: 0.0393701, precision: 1 }
};

export const formatValue = (valMm, unit, showDual = false) => {
    const cfg = UNITS[unit] || UNITS.m;
    const val = (valMm * cfg.factor).toFixed(cfg.precision);
    let str = `${val}${cfg.label}`;

    if (showDual) {
        const altUnit = unit === 'ft' || unit === 'in' ? 'm' : 'ft';
        const altCfg = UNITS[altUnit];
        const altVal = (valMm * altCfg.factor).toFixed(altCfg.precision);
        str += ` (${altVal}${altCfg.label})`;
    }
    return str;
};
