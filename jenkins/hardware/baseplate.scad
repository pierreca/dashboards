bar_depth = 3;

pi_height = 56;
pi_width = 85;
pi_standoff_radius = 4;

ledstrip_depth = 4;
ledstrip_height = 17;
ledstrip_length = 1000;

$fa = 1;
$fs = 0.1;

module ledstrip () {
    color("green") cube([ledstrip_length, ledstrip_height, ledstrip_depth]);
}

module pi() {
    color("green") cube([pi_width, pi_height, 2]);
}

module device_support(bar_height) {
    radius = bar_height / 2;
    device_support_width = pi_width + 2 * radius;
    device_support_height = pi_height + 2 * radius;
    inner_plate_width = device_support_width - 2 * radius;
    inner_plate_height = device_support_height - 2 * radius;
    
    translate([radius, radius + inner_plate_height, 0])
        cylinder(h = bar_depth, r = radius);
    translate([radius + inner_plate_width, radius + inner_plate_height, 0])
        cylinder(h = bar_depth, r = radius);
    translate([0, -bar_height / 2, 0])
        cube([device_support_width, device_support_height, bar_depth]);
    translate([radius, device_support_height - radius, 0])
        cube([inner_plate_width, radius, bar_depth]);
    
    translate([device_support_width, 0, 0]) {
        difference() {
            cube([radius, radius, 1]);
            translate([radius, radius, 0])
                cylinder(h = bar_depth, r = radius);
        }
    }
}

module screw_holes(bar_end_radius, bar_length, bar_height) {
    translate([bar_end_radius, bar_end_radius, - bar_depth / 2])
        cylinder(h = bar_depth * 2, r = 1.5);
    
    translate([bar_length - bar_end_radius, bar_end_radius, - bar_depth / 2])
        cylinder(h = bar_depth * 2, r = 1.5);
}

module pi_holes(bar_height) {
    pi_padding = bar_height / 2;
    translate([pi_padding + pi_standoff_radius, bar_height + pi_padding + pi_height + 0.5, - bar_depth / 2]) {
        cylinder(h = bar_depth * 2, r = 2);
    }
    translate([pi_padding + pi_width - 10, bar_height + pi_padding + pi_height + 0.5, - bar_depth / 2]) {
        cylinder(h = bar_depth * 2, r = 2);
    }
    translate([pi_padding + pi_standoff_radius, bar_height + pi_padding - 0.5, - bar_depth / 2]) {
        cylinder(h = bar_depth * 2, r = 2);
    }
    translate([pi_padding + 47, bar_height + pi_padding - 0.5, - bar_depth / 2]) {
        cylinder(h = bar_depth * 2, r = 2);
    }
    
}

module bar(length, height) {
    radius = height / 2;
    difference() {
        union() {
            translate([radius, radius, 0]) 
                cylinder(h = bar_depth, r = radius);
            translate([radius, 0, 0])  
                cube([length - 2*radius, height, bar_depth]);
            translate([length - radius, radius, 0])
                cylinder(h = bar_depth, r = radius);
        }
        screw_holes();
    }
}

module top_bar(length, height) {
    difference() {
        bar(length, height);
        screw_holes(height / 2, length);
    }
}

module bottom_bar_and_support(bar_length, bar_height) {
    difference() {
        union() {
            translate([0,bar_height,0])
                device_support(bar_height);
            bar(bar_length, bar_height);
        }
        screw_holes(bar_height / 2, bar_length);
        pi_holes(bar_height);
    }
}

module 3dmodel(bar_height, bar_length) {
    translate([bar_height / 2, bar_height + bar_height / 2 , bar_depth])
        pi();
    translate([bar_height / 2 + 15, bar_height / 2 - 17 / 2, bar_depth])    
        ledstrip();
    bottom_bar_and_support(bar_length, bar_height);
    translate([0, 0, bar_depth + ledstrip_depth]) {
        top_bar(bar_length, bar_height);
    }
}

module cutout(bar_height, bar_length) {
    projection() {
        translate([0, bar_height + 10, 0])
            bottom_bar_and_support(bar_length, bar_height);
        top_bar(bar_length, bar_height);
    }
}

/*
3dmodel(30, 1060);
translate([5, 5, 10])
    3dmodel(20, 1050);
*/

cutout(30, 1060);
translate([bar_length, 220, 0])
    rotate([0, 0, 180])
        cutout(20, 1040);
