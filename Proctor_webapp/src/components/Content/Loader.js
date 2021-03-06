import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';


export default function SimpleBackdrop(props) {
  const [open, setOpen] = React.useState(true);
  /*const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };*/

  return (
    <div>
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
        
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}