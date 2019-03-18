import Ticker from './line';
import React, { Component, CSSProperties } from 'react';
import ReactDom from 'react-dom';
import { string } from 'prop-types';
import moment from 'moment';
import RequestsInOrder from './requestOrder';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/combineAll';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/debounce';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/takeLast';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/delay';
import { Observer, Subject, AsyncSubject, BehaviorSubject } from 'rxjs';
import { timingSafeEqual } from 'crypto';

type MyProps = { test?: string };
type MyState = { value?: Map<number, { start: number, end: number }> };
class Alert extends Component<MyProps, MyState> {
  private timerID: NodeJS.Timeout | undefined;
  private count: number = 0;
  private resolutions: Map<number, number>;
  private promises: any[] = [];
  private observable: Observable<any>;
  private behaviorSubject: BehaviorSubject<any> | undefined;
  private requestsInOrder: RequestsInOrder;
  constructor(props: MyProps) {
    super(props);
    const that = this;
    this.requestsInOrder = new RequestsInOrder();
    this.state = { value: new Map() };
    this.timerID = undefined;
    this.resolutions = new Map();
    const {observable, behaviorSubject} = this.requestsInOrder.subscribe('test', (data) => {
      console.log('AsyncSubject data', data);
      if (data) {
        that.resolutions.set(data.count, data.moment);
        that.setState(Object.assign({}, that.state));
      }
    });
    this.observable = observable;
    this.behaviorSubject = behaviorSubject;
  }

  getRandomInt(max: number, min: number): number {
    const value = Math.floor(Math.random() * Math.floor(max));
    if (value < min) {
      return this.getRandomInt(max, min);
    }
    return value;
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => {
        this.tick()
        // console.log(this.count);
        this.count++;
      },
      3000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
    this.requestsInOrder.unsubscribe('test');
  }

  tick() {
    const that = this;
    const now = Date.now();
    const count = that.count;
    const oldState: Map<number, { start: number, end: number }> = this.state.value || new Map<number, { start: number, end: number }>();
    oldState.set(count, { start: now, end: 0 });
    this.setState({ value: oldState });
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const oldState: Map<number, { start: number, end: number }> = this.state.value || new Map<number, { start: number, end: number }>();
        const entry = oldState.get(count) || { start: 0, end: 0 };
        oldState.set(count, Object.assign(entry, { end: Date.now() }));
        resolve({count: count, moment: moment(entry.end).format('mm:ss:SSSS')});
        this.setState({ value: oldState });
      }, this.getRandomInt(8000, 1000));
    });
    this.behaviorSubject.next(promise);
    this.promises.push(promise);
    if (this.count >= 9 && this.timerID !== undefined) {
      clearInterval(this.timerID);
    }
  }

  render() {
    const style: CSSProperties = {
      display: 'inline-block',
      textAlign: 'left',
      verticalAlign: 'top',
      width: '50%'
    }
    return (
      <div>
        <div style={style}>
          <Ticker current={this.state.value} />
        </div>
        <div style={style}>
        {
          (Array.from(this.resolutions.keys()).map((key: number, index: number) => {
            if (this.resolutions.get(key)) {
              return (
                <div key={index}>
                  {key + 1} <span>{this.resolutions.get(key)}</span>
                  <br />
                </div>
              )
            }
            return null;
          })).filter((thing) => thing)
        }
        </div>
      </div>
    );
  }
}

export default Alert;
