import * as React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Box } from "@mui/material";

const CustomDataGrid = ({
  rows = [],
  columns = [],
  loading = false,
  height = 500,
  initialFilter = null,
}) => {
  return (
    <Box sx={{ height, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 25, 50]}
        initialState={{
          filter: {
            filterModel: {
              items: initialFilter ? [initialFilter] : [],
            },
          },
        }}
        slots={{ toolbar: GridToolbar }} // enables filter, export, search
      />
    </Box>
  );
};

export default CustomDataGrid;