/* @deprecated in favour of @mui/material/Button */
import { type ButtonProps, Button as MuiButton } from '@mui/material';

const Button = (props: ButtonProps) => <MuiButton {...props} />;

export default Button;
