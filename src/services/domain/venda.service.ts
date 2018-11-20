import { HttpClient, HttpHeaders } from "@angular/common/http";
import { VendaDTO } from "../../models/venda.dto";
import { Observable } from "rxjs/Observable";
import { Injectable } from "@angular/core";

@Injectable()
export class VendaService {

    public headers: HttpHeaders;

    constructor(public http: HttpClient) {
    }

    findByDataBetween(baseUrl: string, dataInicial: string, dataFinal: string): Observable<any> {
        return this.http.get<VendaDTO[]>(`${baseUrl}/vendas?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
    }
}