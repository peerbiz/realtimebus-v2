'use strict';
module.exports = class LinesFinder {


    constructor(client) {
        this.client = client;
    }

    getAllLines(city) {
        return Promise.resolve()
            .then(() => {
                return `
                    SELECT rec_frt.li_nr, TRIM(rec_frt.str_li_var) AS str_li_var, lidname, li_ri_nr, li_r, li_g, li_b
                    FROM vdv.rec_frt
                    
                    LEFT JOIN vdv.rec_lid
                        ON rec_frt.li_nr=rec_lid.li_nr
                        AND rec_frt.str_li_var=rec_lid.str_li_var
                        
                    LEFT JOIN vdv.line_attributes
                        ON rec_frt.li_nr=line_attributes.li_nr
                        
                    WHERE rec_lid.li_kuerzel LIKE '%${city}%'
                    
                    GROUP BY rec_frt.li_nr, rec_frt.str_li_var, line_attributes.li_nr, lidname, li_ri_nr
                `;
            })
            .then(sql => this.client.query(sql))
            .then(result => {
                return result.rows
            })
    }

    getActiveLines(timeHorizon, city) {
        return Promise.resolve()
            .then(() => {
                return `
                    SELECT rec_frt.li_nr, TRIM(rec_frt.str_li_var) AS str_li_var, lidname, li_ri_nr, li_r, li_g, li_b
                    FROM vdv.rec_frt
                    
                    LEFT JOIN vdv.rec_lid ON rec_frt.li_nr=rec_lid.li_nr AND rec_frt.str_li_var=rec_lid.str_li_var
                    
                    INNER JOIN vdv.menge_tagesart
                        ON rec_frt.tagesart_nr=menge_tagesart.tagesart_nr
                        
                    INNER JOIN vdv.firmenkalender
                        ON menge_tagesart.tagesart_nr=firmenkalender.tagesart_nr
                        
                    LEFT JOIN vdv.line_attributes
                        ON rec_frt.li_nr=line_attributes.li_nr
                        
                    WHERE betriebstag=to_char(CURRENT_TIMESTAMP, 'YYYYMMDD')::integer
                        AND CAST(CURRENT_DATE AS TIMESTAMP) AT TIME ZONE 'GMT+1' + frt_start * interval '1 seconds' > CURRENT_TIMESTAMP - interval '60 minutes'
                        AND CAST(CURRENT_DATE AS TIMESTAMP) AT TIME ZONE 'GMT+1' + frt_start * interval '1 seconds' < CURRENT_TIMESTAMP + interval '${timeHorizon} seconds'
                        AND rec_lid.li_kuerzel LIKE '%${city}%'
                        
                    GROUP BY rec_frt.li_nr, rec_frt.str_li_var, line_attributes.li_nr, lidname, li_ri_nr
                `
            })
            .then(sql => this.client.query(sql))
            .then(result => {
                return result.rows
            })
    }
};