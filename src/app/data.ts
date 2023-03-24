export enum ChartDataType {
    SalesOverTime = 'SalesOverTime',
    SalesPerChannel = 'SalesPerChannel',
    SalesPerCategory = 'SalesPerCategory',
  }
  
  export type DataItem = {
    value: string;
    label?: string;
  };
  
  export const ChartPalettes: DataItem[] = [
    { value: 'Office' },
    { value: 'Light' },
    { value: 'Dark' },
    { value: 'Blue' },
    { value: 'Orange' },
  ];
  
  export const ChartDataTypes: DataItem[] = [
    { value: ChartDataType.SalesOverTime, label: 'Sales over time' },
    { value: ChartDataType.SalesPerChannel, label: 'Sales per channel' },
    { value: ChartDataType.SalesPerCategory, label: 'Sales per category' },
  ];
  
  export const TimePlotTypes: DataItem[] = [{ value: 'Line' }, { value: 'Area' }];
  
  export const CategoryPlotTypes: DataItem[] = [
    { value: 'Bar' },
    { value: 'Column' },
  ];
  
  export const ChannelPlotTypes: DataItem[] = [
    { value: 'Pie' },
    { value: 'Donut' },
  ];
  
  export const getPlotTypes = (dataType: ChartDataType): DataItem[] => {
    switch (dataType) {
      case ChartDataType.SalesOverTime:
        return TimePlotTypes;
      case ChartDataType.SalesPerChannel:
        return ChannelPlotTypes;
      case ChartDataType.SalesPerCategory:
        return CategoryPlotTypes;
      default:
        return [];
    }
  };