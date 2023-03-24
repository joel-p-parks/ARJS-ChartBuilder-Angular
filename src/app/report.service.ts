import { Injectable } from "@angular/core";
import { Rdl as ARJS } from "@grapecity/activereports/core";
import { ChartDataType } from "./data";

/**
 * Utility function that converts given number to a Length unit using inches as a unit of measure
 * @see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Report-Items/Common-Properties/index#length
 */
function inches(val: number): string {
  return `${val}in`;
}

/**
 * Utility function that converts given number to a Length unit using points as a unit of measure
 * @see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Report-Items/Common-Properties/index#length
 */
function points(val: number): string {
  return `${val}pt`;
}

/**
 * Utility function that converts given field name to an expression in Rdl format
 */
function fieldVal(fieldName: string): string {
  return `=Fields!${fieldName}.Value`;
}

function getSalesChannel(channelKey: number): string {
  switch (channelKey) {
    case 1:
      return "Store";
    case 2:
      return "Online";
    case 3:
      return "Catalog";
    case 4:
      return "Reseller";
    default:
      return "Unknown";
  }
}

function getProductCategory(productKey: number): string {
  if (productKey < 116) return "Audio";
  if (productKey < 338) return "TV and Video";
  if (productKey < 944) return "Computers";
  if (productKey < 1316) return "Cameras";
  return "Cell phones";
}

function getChartTitle(dataType: ChartDataType): string {
  switch (dataType) {
    case ChartDataType.SalesOverTime:
      return "Sales over time";
    case ChartDataType.SalesPerChannel:
      return "Sales per channel";
    case ChartDataType.SalesPerCategory:
      return "Sales per category";
    default:
      return "Report";
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor() { }

  private async getDataSource(): Promise<ARJS.DataSource> {
    const url =
      "https://demodata.grapecity.com/contoso/odata/v1/FactSales?$filter=ProductKey+gt+337&$select=ProductKey,SalesAmount,ChannelKey,DateKey";
    // use Web Api to retrieve the data from the demodata API
    const data = await fetch(url).then((res) => res.json());

    // patch the data to resolve sales channel and product category
    data.value = data.value
      //.filter((dataItem) => dataItem.ChannelKey < 3)
      .map((dataItem: any) => {
        // Group date values by month and year
        const salesDate = new Date(dataItem.DateKey);
        salesDate.setDate(1);
        return {
          SalesAmount: dataItem.SalesAmount,
          SalesDate: salesDate,
          SalesChannel: getSalesChannel(dataItem.ChannelKey),
          ProductCategory: getProductCategory(dataItem.ProductKey),
        };
      });

    // construct the data source instance and embed the retrieved data
    // see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Databinding#embedded-json-data-source
    const dataSource: ARJS.DataSource = {
      Name: "DataSource",
      ConnectionProperties: {
        DataProvider: "JSONEMBED",
        ConnectString: `jsondata=${JSON.stringify(data.value)}`,
      },
    };
    return dataSource;
  }

  /**
   * Creates a dataset that reads the data of the data source
   * see https://www.grapecity.com/activereportsjs/docs/ReportAuthorGuide/Databinding#data-set-configuration
   */
  private getDataSet(): ARJS.DataSet {
    const dataSet: ARJS.DataSet = {
      Name: "SalesDataSet",
      Query: {
        CommandText: "$.*",
        DataSourceName: "DataSource",
      },
      Fields: [
        "SalesAmount",
        "SalesDate",
        "SalesChannel",
        "ProductCategory",
      ].map((f) => ({
        Name: f,
        DataField: f,
      })),
    };
    return dataSet;
  }

  private buildPiePlot(structure: ReportStructure): ARJS.DvChartPlot {
    const plot: ARJS.DvChartPlot = {
      PlotName: "Plot",
      PlotChartType: "Pie",
      Config: {
        InnerRadius: structure.plotType === "Donut" ? 0.2 : 0,
        Radial: true,
        AxisMode: "Radial",

        Text: {
          Template: "{PercentageCategory:p0}",
          TextPosition: "Center",
          Style: {
            FontSize: points(14),
          },
        },
      },
    };
    plot.Encodings = plot.Encodings || {};
    // Values encoding for Pie plot defines values for pie parts
    plot.Encodings.Values = [
      {
        Field: {
          Value: [fieldVal("SalesAmount")],
        },
        Aggregate: "Sum",
      },
    ];
    plot.Encodings.Details = [
      {
        Field: {
          Value: [fieldVal("SalesChannel")],
        },
        Group: "Stack",
      },
    ];
    plot.Encodings.Color = {
      Field: { Value: [fieldVal("SalesChannel")] },
    };
    return plot;
  }

  private buildPiePlotArea(structure: ReportStructure): ARJS.DvChartPlotArea {
    const plotArea: ARJS.DvChartPlotArea = {
      Legends: [
        {
          LegendType: "Color",
          Orientation: "Vertical",
          Position: "Right",
        },
      ],
      Axes: [
        {
          AxisType: "X",
          Position: "None",
          Plots: ["Plot"],
        },
        {
          AxisType: "Y",
          Format: "p0",
          Position: "None",
          Scale: "Percentage",
          Plots: ["Plot"],
        },
      ],
    };
    return plotArea;
  }

  private buildColumnBarPlot(structure: ReportStructure): ARJS.DvChartPlot {
    const plot: ARJS.DvChartPlot = {
      PlotName: "Plot",
      PlotChartType: structure.plotType as any,
      Config: {
        SwapAxes: structure.plotType === "Bar",
      },
    };

    plot.Encodings = plot.Encodings || {};
    // Category encoding for Bar & Column plots defines values for X axis
    plot.Encodings.Category = {
      Field: {
        Value: [fieldVal("ProductCategory")],
      },
    };
    // Values encoding for Line & Area plot defines values for Y axis
    plot.Encodings.Values = [
      {
        Field: {
          Value: [fieldVal("SalesAmount")],
        },
        Aggregate: "Sum",
      },
    ];
    if (structure.grouping) {
      plot.Encodings.Details = [
        {
          Field: { Value: [fieldVal("SalesChannel")] },
          Group: "Cluster",
        },
      ];
      plot.Encodings.Color = {
        Field: { Value: [fieldVal("SalesChannel")] },
      };
    }
    return plot;
  }

  private buildColumnBarPlotArea(
    structure: ReportStructure
  ): ARJS.DvChartPlotArea {
    const plotArea: ARJS.DvChartPlotArea = {
      Axes: [
        {
          AxisType: "X",
          Plots: ["Plot"],
          // LabelAngle: -45,
          // Format: 'MM-YYYY',
          LabelStyle: {
            Color: "#1a1a1a",
          },
          LineStyle: {
            Border: {
              Color: "#ccc",
              Width: points(2),
              Style: "Solid",
            },
          },
        },
        {
          AxisType: "Y",
          Plots: ["Plot"],
          Format: "c0",
          LabelStyle: {
            Color: "#1a1a1a",
          },
          MajorGrid: true,
          MajorGridStyle: {
            Border: {
              Color: "#ccc",
              Style: "Dotted",
              Width: points(0.25),
            },
          },
        },
      ],
    };
    if (structure.grouping) {
      plotArea.Legends = [
        {
          LegendType: "Color",
          Orientation: "Vertical",
          Position: "Right",
        },
      ];
    }
    return plotArea;
  }

  private buildTimePlot(structure: ReportStructure): ARJS.DvChartPlot {
    const plot: ARJS.DvChartPlot = {
      PlotName: "Plot",
      PlotType: structure.plotType as any,
    };

    plot.Encodings = plot.Encodings || {};
    // Category encoding for Line & Area plot defines values for X axis
    plot.Encodings.Category = {
      Field: {
        Value: [fieldVal("SalesDate")],
      },
      Sort: "Ascending",
      SortingField: fieldVal("SalesDate"),
    };
    // Values encoding for Line & Area plot defines values for Y axis
    plot.Encodings.Values = [
      {
        Field: {
          Value: [fieldVal("SalesAmount")],
        },
        Aggregate: "Sum",
      },
    ];

    plot.Config = {
      LineAspect: "Spline",
      LineStyle: {
        Style: "Solid",
        Width: points(2),
      },
      ShowNulls: "Connected",
    };

    return plot;
  }

  private buildTimePlotArea(structure: ReportStructure): ARJS.DvChartPlotArea {
    const plotArea: ARJS.DvChartPlotArea = {
      Axes: [
        {
          AxisType: "X",
          Plots: ["Plot"],
          LabelAngle: -45,
          Format: "MM-YYYY",
          LabelStyle: {
            Color: "#1a1a1a",
          },
          LineStyle: {
            Border: {
              Color: "#ccc",
              Width: points(2),
              Style: "Solid",
            },
          },
        },
        {
          AxisType: "Y",
          Plots: ["Plot"],
          Format: "c0",
          LabelStyle: {
            Color: "#1a1a1a",
          },
          MajorGrid: true,
          MajorGridStyle: {
            Border: {
              Color: "#ccc",
              Style: "Dotted",
              Width: points(0.25),
            },
          },
        },
      ],
    };
    return plotArea;
  }

  private buildPlotArea(structure: ReportStructure): ARJS.DvChartPlotArea {
    switch (structure.dataType) {
      case ChartDataType.SalesOverTime:
        return this.buildTimePlotArea(structure);
      case ChartDataType.SalesPerCategory:
        return this.buildColumnBarPlotArea(structure);
      case ChartDataType.SalesPerChannel:
        return this.buildPiePlotArea(structure);
    }
  }

  private buildPlot(structure: ReportStructure): ARJS.DvChartPlot {
    switch (structure.dataType) {
      case ChartDataType.SalesOverTime:
        return this.buildTimePlot(structure);
      case ChartDataType.SalesPerCategory:
        return this.buildColumnBarPlot(structure);
      case ChartDataType.SalesPerChannel:
        return this.buildPiePlot(structure);
    }
  }

  public async generateReport(
    structure: any
  ): Promise<ARJS.Report> {
    const chart: ARJS.DvChart = {
      Type: "dvchart",
      Name: "salesChart",
      Top: inches(0),
      Left: inches(0),
      Width: inches(7.5),
      Height: inches(6),
      DataSetName: "SalesDataSet",
      Palette: structure.palette as any,
      PlotArea: this.buildPlotArea(structure),
      Plots: [this.buildPlot(structure)],
      Header: {
        Title: getChartTitle(structure.dataType),
        TextStyle: {
          Color: "#3da7a8",
          FontSize: points(24),
        },
        HAlign: "Center",
        VAlign: "Middle",
        Style: {
          PaddingTop: points(12),
          PaddingBottom: points(6),
        },
      },
      Bar: {
        Width: structure.dataType === ChartDataType.SalesPerCategory ? 0.5 : 1,
      },
    };

    // finally create a report with the chart in the body
    const report: ARJS.Report = {
      DataSources: [await this.getDataSource()],
      DataSets: [this.getDataSet()],
      Page: {
        TopMargin: inches(0.5),
        BottomMargin: inches(0.5),
        LeftMargin: inches(0.5),
        RightMargin: inches(0.5),
        PageWidth: inches(8.5),
        PageHeight: inches(11),
      },
      Body: {
        ReportItems: [chart],
        Height: inches(6),
      },
      Width: inches(7.5),
    };
    //console.log(JSON.stringify(report));
    return report;
  }
}

export interface ReportStructure {
  dataType: ChartDataType;
  plotType: string;
  palette: string;
  grouping: boolean;
}