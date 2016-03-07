bar_height = 30;
bar_length = 1090;

device_width = 110;
device_height = 80;

module device_support(length, height, b_height) {
    radius = b_height / 2;
    device_plate_width = length - 2 * radius;
    device_plate_height = height - 2 * radius;
    
    translate([radius, radius + device_plate_height, 0])
        cylinder(h = 1, r = radius);
    translate([radius + device_plate_width, radius + device_plate_height, 0])
        cylinder(h = 1, r = radius);
    translate([0, -bar_height / 2, 0])
        cube([device_width, device_height, 1]);
    translate([radius, device_height - radius, 0])
        cube([device_plate_width, radius, 1]);
    
    translate([device_width, 0, 0]) {
        difference() {
            cube([radius, radius, 1]);
            translate([radius, radius, 0])
                cylinder(h = 1, r = radius);
        }
    };
}

module bar(length, height) {
    radius = height / 2;
    translate([radius, radius, 0]) 
        cylinder(h = 1, r = radius);
    translate([radius, 0, 0])  
        cube([length - 2*radius, height, 1]);
    translate([length - radius, radius, 0])
        cylinder(h = 1, r = radius);
}

projection() {
    translate([0,bar_height,0])
        device_support(device_width, device_height, bar_height);
    bar(bar_length, bar_height);
    translate([0,-bar_height - 10, 0]) {
        bar(bar_length, bar_height);
    };
}