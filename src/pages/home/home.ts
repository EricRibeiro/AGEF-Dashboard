import { Chart } from 'chart.js';
import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import * as palette from 'google-palette';
import { VendaService } from '../../services/domain/venda.service';
import { DatePipe } from '@angular/common';
import { VendaDTO } from '../../models/venda.dto';
import { UtilsService } from '../../services/utils/utils.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('canvasPizza') canvasPizza;

  graficoPizza: any;
  lojas: string[] = [];
  valorMovimentado: number = 0;
  qtdTotalPecasVendidas: number = 0;
  qtdTotalVendas: number = 0;
  qtdVendasPorLoja: number[] = [];


  constructor(
    public datePipe: DatePipe,
    public navCtrl: NavController,
    public socket: Socket,
    public utilsService: UtilsService,
    public vendaService: VendaService) {

    this.socket.connect();

  }

  ionViewDidLoad() {
    this.escutarClientes().subscribe(message => {
      console.log(message);

      let baseUrl = message.url;
      let hoje = new Date();
      let hojeStr = this.datePipe.transform(hoje, 'dd/MM/yyyy');

      this.vendaService.findByDataBetween(baseUrl, hojeStr, hojeStr)
        .subscribe(response => {
          let loja = message.nickname;
          let precoStr = this.calcValorTotalVendas(response);
          let preco = Number(this.utilsService.trocarPontuacaoPreco(precoStr));

          if (this.lojas.includes(loja)) {
            let indiceLoja = this.lojas.indexOf(loja);
            this.qtdVendasPorLoja[indiceLoja] += preco;

          } else {
            this.lojas.push(loja);
            this.qtdVendasPorLoja.push(preco);

          }

          this.exibirGrafico(this.lojas, this.qtdVendasPorLoja);
        });
    });
  }

  ionViewWillEnter() {
    this.escutarVendas().subscribe(message => {
      let loja = message.nickname;
      let operacao = message.venda.operacao;

      if (operacao === "venda") {
        this.qtdTotalPecasVendidas += message.venda.venda.quantidade;
        this.qtdTotalVendas++;
        this.valorMovimentado += (message.venda.venda.preco * message.venda.venda.quantidade);

        if (this.lojas.includes(loja)) {
          let indiceLoja = this.lojas.indexOf(loja);
          this.qtdVendasPorLoja[indiceLoja] += 1;

        } else {
          this.lojas.push(loja);
          this.qtdVendasPorLoja.push(1);

        }

      } else if (operacao === "estorno") {
        this.qtdTotalPecasVendidas -= message.venda.venda.quantidade;
        this.qtdTotalVendas--;
        this.valorMovimentado -= (message.venda.venda.preco * message.venda.venda.quantidade);

        let indiceLoja = this.lojas.indexOf(loja);
        this.qtdVendasPorLoja[indiceLoja] -= 1;
      }

      this.exibirGrafico(this.lojas, this.qtdVendasPorLoja);
    });
  }

  ionViewWillLeave() {
    this.socket.disconnect();
  }

  public calcValorTotalVendas(qtdVendasPorLoja: VendaDTO[]): string {
    let valorTotal = qtdVendasPorLoja.reduce(function (acc, venda) {
      return acc + (venda.preco * venda.quantidade);
    }, 0);

    return this.mascararDinheiro(valorTotal);
  }

  public exibirGrafico(rotulos: any[], dados: any[]): void {
    Chart.defaults.global.legend.display = false;

    this.graficoPizza = new Chart(this.canvasPizza.nativeElement, {
      type: 'pie',
      data: {
        labels: rotulos,
        datasets: [{
          data: dados,
          backgroundColor: palette('cb-Set3', dados.length).map(function (hex) {
            return '#' + hex;
          })
        }],
      },

    });
  }

  public escutarVendas(): Observable<any> {
    let observable = new Observable(observer => {
      this.socket.on('venda', (data) => {
        observer.next(data);
      });
    })

    return observable;
  }

  public escutarClientes(): Observable<any> {
    let observable = new Observable(observer => {
      this.socket.on('cliente', (data) => {
        observer.next(data);
      });
    })

    return observable;
  }

  public mascararDinheiro(valor: number): string {
    return this.utilsService.mascaraDinheiro(valor);
  }
}