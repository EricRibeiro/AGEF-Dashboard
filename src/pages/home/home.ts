import { Chart } from 'chart.js';
import { Component, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import { Storage } from '@ionic/storage';
import { UtilsService } from '../../services/utils/utils.service';
import { VendaDTO } from '../../models/venda.dto';
import { VendaService } from '../../services/domain/venda.service';
import * as palette from 'google-palette';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('canvasPizza') canvasPizza;

  graficoPizza: any;
  lojas: string[] = [];
  valorTotalMovimentado: number = 0;
  qtdTotalPecasVendidas: number = 0;
  qtdTotalVendas: number = 0;
  qtdVendasPorLoja: number[] = [];

  constructor(
    public datePipe: DatePipe,
    public navCtrl: NavController,
    public socket: Socket,
    public storage: Storage,
    public utilsService: UtilsService,
    public vendaService: VendaService) {

    this.socket.connect();

  }

  ionViewDidLoad() {
  }

  ionViewWillEnter() {
    this.storage.length().then(tamStorage => {
      if (tamStorage > 0) {
        let hoje = new Date();
        let hojeStr = this.datePipe.transform(hoje, 'dd/MM/yyyy');

        this.storage.forEach((value, key) => {
          this.recuperarDadosLojas(value, key, hojeStr, hojeStr);
        });
      }
    });

    this.escutarClientes().subscribe(message => {
      this.onConexaoClienteAtualizarDados(message);
    });

    this.escutarVendas().subscribe(message => {
      this.onConexaoVendaAtualizarDados(message);
    });
  }

  ionViewWillLeave() {
    this.socket.disconnect();
  }

  private atualizarDados(nomeLoja: string, qtdPecasVendidas: number, qtdVendas: number, valorMovimentado: number) {
    nomeLoja = nomeLoja.substr(nomeLoja.indexOf("-") + 1);
    nomeLoja = nomeLoja.charAt(0).toUpperCase() + nomeLoja.slice(1);

    this.qtdTotalVendas += qtdVendas;
    this.qtdTotalPecasVendidas += qtdPecasVendidas;
    this.valorTotalMovimentado += valorMovimentado;

    if (this.lojas.includes(nomeLoja)) {
      let indiceLoja = this.lojas.indexOf(nomeLoja);
      this.qtdVendasPorLoja[indiceLoja] += qtdVendas;

    } else {
      this.lojas.push(nomeLoja);
      this.qtdVendasPorLoja.push(qtdVendas);

    }

    this.exibirGrafico(this.lojas, this.qtdVendasPorLoja);
  }

  private onConexaoClienteAtualizarDados(message: any): void {
    let baseUrl = message.url;
    let loja = message.nickname;
    let hoje = new Date();
    let hojeStr = this.datePipe.transform(hoje, 'dd/MM/yyyy');

    this.storage.set(loja, baseUrl);
    this.resetarDados();

    this.storage.forEach((value, key) => {
      this.recuperarDadosLojas(value, key, hojeStr, hojeStr);
    });
  }

  private onConexaoVendaAtualizarDados(message: any): void {
    let nomeLoja = message.nickname;
    let operacao = message.venda.operacao;
    let qtdPecasVendidas = message.venda.venda.quantidade;
    let qtdVendas = 1;
    let valorMovimentado = message.venda.venda.preco * message.venda.venda.quantidade;

    // TODO-Eric implementar correção do bug descrito com a equipe
    this.storage.get(nomeLoja).then(data => {
      if (data) {
        alert("exists");
      }
      else { }
    })

    if (operacao === "venda") {
      this.atualizarDados(nomeLoja, qtdPecasVendidas, qtdVendas, valorMovimentado);

    } else if (operacao === "estorno") {
      this.qtdTotalPecasVendidas -= message.venda.venda.quantidade;
      this.qtdTotalVendas--;
      this.valorTotalMovimentado -= (message.venda.venda.preco * message.venda.venda.quantidade);

      let indiceLoja = this.lojas.indexOf(nomeLoja);
      this.qtdVendasPorLoja[indiceLoja] -= 1;
    }
  }

  private calcQtdTotalPecasVendidas(vendas: VendaDTO[]): number {
    return vendas.reduce(function (acc, venda) {
      return acc + venda.quantidade;
    }, 0);
  }

  private calcValorTotalVendas(vendas: VendaDTO[]): number {
    return vendas.reduce(function (acc, venda) {
      return acc + (venda.preco * venda.quantidade);
    }, 0);
  }

  private escutarClientes(): Observable<any> {
    let observable = new Observable(observer => {
      this.socket.on('cliente', (data) => {
        observer.next(data);
      });
    })

    return observable;
  }

  private escutarVendas(): Observable<any> {
    let observable = new Observable(observer => {
      this.socket.on('venda', (data) => {
        observer.next(data);
      });
    })

    return observable;
  }

  private exibirGrafico(rotulos: any[], dados: number[]): void {
    Chart.defaults.global.legend.display = false;

    this.graficoPizza = new Chart(this.canvasPizza.nativeElement, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: palette('cb-Set3', this.qtdVendasPorLoja.length).map(function (hex) {
            return '#' + hex;
          })
        }],
      },

    });

    for (var i = 0; i < dados.length; i++) {
      this.graficoPizza.data.datasets[0].data.push(dados[i]);
      this.graficoPizza.data.labels.push(rotulos[i]);
    }

    this.graficoPizza.update();
  }

  private recuperarDadosLojas(baseUrl: string, nomeLoja: string, dataInicial: string, dataFinal: string) {
    this.vendaService.findByDataBetween(baseUrl, dataInicial, dataFinal)
      .subscribe(response => {
        let vendas: VendaDTO[] = response;
        let qtdVendas = vendas.length;
        let qtdPecasVendidas = this.calcQtdTotalPecasVendidas(vendas);
        let valorMovimentado = this.calcValorTotalVendas(vendas);

        this.atualizarDados(nomeLoja, qtdPecasVendidas, qtdVendas, valorMovimentado);
      });
  }

  private resetarDados(): void {
    this.lojas.length = 0;
    this.qtdTotalVendas = 0;
    this.qtdTotalPecasVendidas = 0;
    this.qtdVendasPorLoja.length = 0;
    this.valorTotalMovimentado = 0;
  }

  public mascararDinheiro(valor: number): string {
    return this.utilsService.mascaraDinheiro(valor);
  }
}