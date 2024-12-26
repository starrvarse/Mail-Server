import PropTypes from 'prop-types';

const DrawerContent = ({ menuItems, navigate, unreadCount }) => (
  <Box>
    <Toolbar />
    <List role="menu" aria-label="Main navigation">
      {menuItems.map((item) => (
        <ListItem
          component="div"
          key={item.text}
          role="menuitem"
          tabIndex={0}
          onClick={() => navigate(item.path)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(item.path);
            }
          }}
          sx={{ 
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&:focus': {
              backgroundColor: 'action.selected',
              outline: 'none',
            },
          }}
        >
          <ListItemIcon>
            {item.badge ? (
              <Badge badgeContent={item.badge} color="primary">
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  </Box>
);

DrawerContent.propTypes = {
  menuItems: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    path: PropTypes.string.isRequired,
    badge: PropTypes.number,
  })).isRequired,
  navigate: PropTypes.func.isRequired,
  unreadCount: PropTypes.number,
};
