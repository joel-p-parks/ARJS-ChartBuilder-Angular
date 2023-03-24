import { Component, ViewChild } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { ViewerComponent } from "@grapecity/activereports-angular";
import {
  ChartDataTypes,
  DataItem,
  getPlotTypes,
  ChartPalettes,
  ChartDataType,
} from "./data";
import { ReportService } from "./report.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  constructor(private fb: FormBuilder, private reportService: ReportService) {}
  @ViewChild(ViewerComponent, { static: false })
  reportViewer!: ViewerComponent;
  Mode: "Design" | "Preview" = "Design";
  DataTypes: DataItem[] = ChartDataTypes;
  PlotTypes: DataItem[] = [];
  ChartPalettes = ChartPalettes;
  chartForm = this.fb.group({
    dataType: ["", Validators.required],
    plotType: [{ value: "", disabled: true }, Validators.required],
    grouping: [{ value: false, disabled: true }],
    palette: ["Office", Validators.required],
  });
  ngAfterViewInit() {
    //console.log(this.chartForm.value);
    this.chartForm.get("dataType")?.valueChanges.subscribe(val => {
      const chartDataType = val as ChartDataType;
      this.PlotTypes = getPlotTypes(chartDataType);
      this.chartForm.get("plotType")?.setValue("");
      this.chartForm.get("plotType")?.enable();
      this.chartForm.get("grouping")?.setValue(false);
      if (chartDataType === ChartDataType.SalesPerCategory) {
        this.chartForm.get("grouping")?.enable();
      } else {
        this.chartForm.get("grouping")?.disable();
      }
    });
  }
  updateToolbar() {
    var designButton = {
      key: "$openDesigner",
      text: "Designer",
      iconCssClass: "mdi mdi-reply",
      enabled: true,
      action: () => {
        this.Mode = "Design";
      },
    };
    this.reportViewer.toolbar.addItem(designButton);
    this.reportViewer.toolbar.updateLayout({
      default: [
        "$openDesigner",
        "$split",
        "$navigation",
        "$split",
        "$refresh",
        "$split",
        "$history",
        "$split",
        "$zoom",
        "$fullscreen",
        "$split",
        "$print",
        "$split",
        "$singlepagemode",
        "$continuousmode",
        "$galleymode",
      ],
    });
  }
  onSubmit() {
    this.Mode = "Preview";
    //console.log(this.chartForm.value);
  }
  onViewerInit() {
    this.updateToolbar();
    const report = this.reportService.generateReport(this.chartForm.value);
    this.reportViewer.open("report", {
      ResourceLocator: {
        getResource(resource: string) {
          return report as any;
        },
      },
    });
  }
}