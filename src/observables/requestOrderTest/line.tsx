import React, {Component} from 'react';
import moment from 'moment';

type MyProps = { current?: Map<number, {start: number, end: number}> };
class Ticker extends Component<MyProps, {}> {
  private renderValue: React.ReactElement | string;
  constructor(props: MyProps) {
    super(props);
    this.renderValue = 'NO TEST FOUND';
    this.getRenderValue();
  }

  getRenderValue() {
    if (this.props.current) {
      this.renderValue = (
      <div>

      {
        this.props.current === undefined ? (<span></span>) :
        (Array.from(this.props.current.keys()).map((key: any, index) => {
          let value: {start: number, end: number} | undefined = this.props.current === undefined? {start:0, end: 0} : this.props.current.get(key);
          return (
            <div key={index}>
              <span>
                {index + 1}: {value ? moment(value.start).format('mm:ss:SSS'): 0} : {value? moment(value.end).format('mm:ss:SSS') : 0}
              </span>
              <br/>
            </div>
          )
        }))
      }
      </div>
    );
  }}

  render() {
    this.getRenderValue();
    return (
      <div>
        {this.renderValue}
      </div>
    );
  }
}

export default Ticker;
