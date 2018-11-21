import { Injectable } from '@angular/core';
import { BrMaskerIonicServices3 } from 'brmasker-ionic-3';

@Injectable()
export class MoneyService {

    constructor(private brMasker: BrMaskerIonicServices3) {
    }

    public mascaraDinheiro(valor: number): string {
        let valorStr: string = valor.toFixed(2);

        return this.brMasker.writeValueMoney(valorStr);
    }

    public trocarPontuacaoPreco(valor: string): string {
        return valor
            .replace(".", "")
            .replace(",", ".");
    }
}