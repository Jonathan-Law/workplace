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
import { Subject, BehaviorSubject } from 'rxjs';

export interface ISubscribeObjResult{
  observable: Observable<any>
  behaviorSubject: BehaviorSubject<Promise<any>>
}

/**
 * RequestsInOrder: A Class used to create observable patterns that reduces request results to only the most latest
 * and emits those on a stream that will result in the observable.subscribe callback
 */
class RequestsInOrder {
  private streams: Map<string, Subject<Promise<any>> | undefined>;
  private behaviorSubjects: Map<string, BehaviorSubject<Promise<any>> | undefined>;

  /**
   * Initialize the subject maps
   */
  constructor() {
    // One of the variants of Subjects is the BehaviorSubject, which has a notion of "the current value".
    // It stores the latest value emitted to its consumers, and whenever a new Observer subscribes,
    // it will immediately receive the "current value" from the BehaviorSubject.
    this.behaviorSubjects = new Map();

    // What is a Subject? An RxJS Subject is a special type of Observable that allows values to be multicasted to many Observers. 
    // While plain Observables are unicast (each subscribed Observer owns an independent execution of the Observable), Subjects are multicast.
    this.streams = new Map();
  }
  
  /**
   * setupBehavior: a method used to keep track of the "latest current value" which should be of type promise. This subject is used to ignore all outdated
   * requests
   * @param key string used to keep track of behaviors
   * @returns behaviorSubject a BehaviorSubject useful for triggering events on
   */
  setupBehavior(key): BehaviorSubject<Promise<any>> {
    // create, or gather the behavior subject for this key
    const that = this;
    const behaviorSubject = that.behaviorSubjects.get(key) || new BehaviorSubject(Promise.resolve(undefined));
    that.behaviorSubjects.set(key, behaviorSubject);

    // subscribe to the behaviorObserver given that we will be receiving promises as subject matter (REST requests through ajax)
    behaviorSubject.asObservable().subscribe((promise) => {
      promise.then((val) => {
        // Check if we're resolving the current latest promise...
        if (behaviorSubject.getValue() === promise) {
          promise.then(that.updateStream.bind(that, key));
        }
      });
    });

    // expose the stream if we need to trigger .next .error or .cancel on it
    return behaviorSubject;
  }
  
  /**
   * updateStream: a method for sending events on the stream that the observable is subscribed to
   * @param key string used to keep track of streams
   * @param data callbackResults
   */
  updateStream(key, ...data): void {
    // update the subscribingStream
    this.streams.get(key).next(...data);
  }

  /**
   * unsubscribe: method used to close streams
   * @param key string used for keeping track of everything
   */
  unsubscribe(key): void {
    this.unsubscribeBehaviorSubject(key);
    this.unsubscribeStream(key);
  }

  /**
   * unsubscribeBehaviorSubject: method used to close behavior subjects
   * @param key string used for keeping track of behaviors
   */
  unsubscribeBehaviorSubject(key): void {
    const behaviorSubject = this.behaviorSubjects.get(key);
    if (behaviorSubject) {
      behaviorSubject.unsubscribe();
      this.behaviorSubjects.delete(key);
    }
  }

  /**
   * unsubscribeStream: method used to close stream subjects
   * @param key string used for keeping track of streams
   */
  unsubscribeStream(key): void {
    const stream = this.streams.get(key);
    if (stream) {
      stream.unsubscribe();
      this.streams.delete(key);
    }
  }

  /**
   * subscribe: method used to connect to stream events
   * @param key string used to keep track of subscription entry
   * @param subscribeFn optional parameter used to create callbacks for stream events
   */
  subscribe(key, subscribeFn?: (...args) => any): ISubscribeObjResult {
    // create, or gather a new subject that we can create events on
    const stream = this.streams.get(key) || new Subject();
    this.streams.set(key, stream);

    const behaviorSubject = this.setupBehavior(key);

    const observable = this.streams.get(key).asObservable();
    if (subscribeFn) {
      observable.subscribe(subscribeFn);
    }
    return {
      observable,
      behaviorSubject,
    }
  }
  
}

export default RequestsInOrder;
