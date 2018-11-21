import { Chart } from 'chart.js';
import { Component, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import { Storage } from '@ionic/storage';
import { MoneyService } from '../../services/utils/money.service';
import { VendaDTO } from '../../models/venda.dto';
import { VendaService } from '../../services/domain/venda.service';
import * as palette from 'google-palette';
import { DialogService } from '../../services/utils/dialog.service';

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
    public dialogoService: DialogService,
    public navCtrl: NavController,
    public moneyService: MoneyService,
    public socket: Socket,
    public storage: Storage,
    public vendaService: VendaService) {

    this.socket.connect();

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
      this.onConexaoClienteAtualizarDados(message.url, message.nickname);
    });

    this.escutarVendas().subscribe(message => {
      this.onConexaoVendaAtualizarDados(message);
    });
  }

  ionViewWillLeave() {
    this.socket.disconnect();
  }

  private atualizarDadosEstorno(nomeLoja: string, qtdPecasEstornadas: number, qtdEstornos: number, valorMovimentado: number): void {
    nomeLoja = this.formatarNomeLoja(nomeLoja);

    this.qtdTotalPecasVendidas -= qtdPecasEstornadas;
    this.qtdTotalVendas -= qtdEstornos;
    this.valorTotalMovimentado -= valorMovimentado;

    let indiceLoja = this.lojas.indexOf(nomeLoja);
    this.qtdVendasPorLoja[indiceLoja] -= 1;

    this.exibirGrafico(this.lojas, this.qtdVendasPorLoja);
  }

  private atualizarDadosVenda(nomeLoja: string, qtdPecasVendidas: number, qtdVendas: number, valorMovimentado: number): void {
    nomeLoja = this.formatarNomeLoja(nomeLoja);

    this.qtdTotalPecasVendidas += qtdPecasVendidas;
    this.qtdTotalVendas += qtdVendas;
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

  private formatarNomeLoja(nomeLoja: string): string {
    nomeLoja = nomeLoja.substr(nomeLoja.indexOf("-") + 1);
    nomeLoja = nomeLoja.charAt(0).toUpperCase() + nomeLoja.slice(1);

    return nomeLoja;
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

  private onConexaoClienteAtualizarDados(baseUrl: string, nomeLoja: string): void {
    let hoje = new Date();
    let hojeStr = this.datePipe.transform(hoje, 'dd/MM/yyyy');
    let nomeLojaFrmtd = this.formatarNomeLoja(nomeLoja);

    this.dialogoService.exibirToast(`${nomeLojaFrmtd} se conectou.`)

    this.storage.set(nomeLoja, baseUrl).then(() => {
      this.resetarDados();

      this.storage.forEach((value, key) => {
        this.recuperarDadosLojas(value, key, hojeStr, hojeStr);
      });
    });
  }

  private onConexaoVendaAtualizarDados(message: any): void {
    let baseUrl = message.venda.baseUrl;
    let nomeLoja = message.nickname;
    let operacao = message.venda.operacao;
    let qtdPecasMovimentadas = message.venda.venda.quantidade;
    let qtdOperacoes = 1;
    let valorMovimentado = message.venda.venda.preco * message.venda.venda.quantidade;

    // Verificando se a loja está conectada mas não está no storage.
    this.storage.get(nomeLoja).then(data => {
      if (data) {
        if (operacao === "venda") {
          this.atualizarDadosVenda(nomeLoja, qtdPecasMovimentadas, qtdOperacoes, valorMovimentado);

        } else if (operacao === "estorno") {
          this.atualizarDadosEstorno(nomeLoja, qtdPecasMovimentadas, qtdOperacoes, valorMovimentado);
        }

      } else {
        this.onConexaoClienteAtualizarDados(baseUrl, nomeLoja);

      }
    })
  }

  private recuperarDadosLojas(baseUrl: string, nomeLoja: string, dataInicial: string, dataFinal: string) {
    this.vendaService.findByDataBetween(baseUrl, dataInicial, dataFinal)
      .subscribe(response => {
        let vendas: VendaDTO[] = response;
        let qtdVendas = vendas.length;
        let qtdPecasVendidas = this.calcQtdTotalPecasVendidas(vendas);
        let valorMovimentado = this.calcValorTotalVendas(vendas);

        this.atualizarDadosVenda(nomeLoja, qtdPecasVendidas, qtdVendas, valorMovimentado);
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
    return this.moneyService.mascaraDinheiro(valor);
  }
}